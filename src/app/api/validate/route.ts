export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { Key, Log, Blacklist, KeyUsage } from "@/models";
import { rateLimit } from "@/lib/rateLimit";
import { webhook } from "@/lib/webhook";

const schema = z.object({
  key:        z.string().min(1).max(200),
  hwid:       z.string().min(1).max(200),
  ip:         z.string().optional(),
  robloxNick: z.string().optional(),
});

function getClientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ valid: false, message: "Dados inválidos." }, { status: 400 });
  }

  const { key, hwid, robloxNick } = parsed.data;

  // Rate limit por HWID (10 req/min)
  const rlHwid = rateLimit({ key: `validate:hwid:${hwid}`, limit: 10, windowMs: 60_000 });
  // Rate limit por IP (20 req/min)
  const rlIp = rateLimit({ key: `validate:ip:${clientIp}`, limit: 20, windowMs: 60_000 });

  if (!rlHwid.allowed || !rlIp.allowed) {
    webhook.send({ type: "blocked_attempt", key, hwid, ip: clientIp, robloxNick, message: "Rate limit excedido" });
    return NextResponse.json({ valid: false, message: "Muitas requisições. Aguarde." }, { status: 429 });
  }

  await dbConnect();

  // Verifica blacklist de HWID e IP
  const blocked = await Blacklist.findOne({
    $or: [
      { type: "hwid", value: hwid },
      { type: "ip",   value: clientIp },
      ...(robloxNick ? [{ type: "robloxNick", value: robloxNick }] : []),
    ],
  });

  if (blocked) {
    await Log.create({ type: "blocked_attempt", key, hwid, ip: clientIp, robloxNick, message: `Bloqueado: ${blocked.type} = ${blocked.value}` });
    webhook.send({ type: "blocked_attempt", key, hwid, ip: clientIp, robloxNick, message: `Banido por ${blocked.type}` });
    return NextResponse.json({ valid: false, message: "Acesso bloqueado." }, { status: 403 });
  }

  // Busca a key no banco
  const record = await Key.findOne({ key });

  if (!record) {
    await Log.create({ type: "invalid_attempt", key, hwid, ip: clientIp, robloxNick, message: "Key não encontrada" });
    webhook.send({ type: "invalid_attempt", key, hwid, ip: clientIp, robloxNick, message: "Key não encontrada" });
    return NextResponse.json({ valid: false, message: "Key inválida." });
  }

  if (record.status !== "active") {
    await Log.create({ type: "invalid_attempt", key, hwid, ip: clientIp, robloxNick, message: `Status: ${record.status}` });
    webhook.send({ type: "invalid_attempt", key, hwid, ip: clientIp, robloxNick, message: `Key com status: ${record.status}` });
    return NextResponse.json({ valid: false, message: "Key inativa ou expirada." });
  }

  // Verifica expiração
  if (record.expiresAt && new Date() > record.expiresAt) {
    await Key.updateOne({ _id: record._id }, { status: "expired", deletedAt: new Date() });
    await Log.create({ type: "invalid_attempt", key, hwid, ip: clientIp, robloxNick, message: "Key expirada" });
    return NextResponse.json({ valid: false, message: "Key expirada." });
  }

  // Verifica se HWID já está registrado em outra key ativa
  if (!record.hwid) {
    // Primeira execução — prende no HWID
    const existingKeyForHwid = await Key.findOne({ hwid, status: "active", key: { $ne: key } });
    if (existingKeyForHwid) {
      await Log.create({ type: "blocked_attempt", key, hwid, ip: clientIp, robloxNick, message: "HWID tentou usar segunda key" });
      webhook.send({ type: "blocked_attempt", key, hwid, ip: clientIp, robloxNick, message: "HWID já vinculado a outra key" });
      return NextResponse.json({ valid: false, message: "HWID já vinculado a outra key." });
    }

    await Key.updateOne({ _id: record._id }, { hwid, ip: clientIp, robloxNick });
  } else {
    // HWID já vinculado — verifica se bate
    if (record.hwid !== hwid) {
      await Log.create({ type: "blocked_attempt", key, hwid, ip: clientIp, robloxNick, message: "HWID incorreto" });
      webhook.send({ type: "blocked_attempt", key, hwid, ip: clientIp, robloxNick, message: "HWID divergente" });
      return NextResponse.json({ valid: false, message: "Key não autorizada para este dispositivo." });
    }
  }

  // Atualiza contagem e último uso
  await Key.updateOne(
    { _id: record._id },
    { $inc: { usageCount: 1 }, lastUsedAt: new Date(), robloxNick }
  );

  // Registra uso
  await KeyUsage.create({ key, hwid, ip: clientIp, robloxNick });
  await Log.create({ type: "execution", key, hwid, ip: clientIp, robloxNick });
  webhook.send({ type: "execution", key, hwid, ip: clientIp, robloxNick });

  return NextResponse.json({ valid: true, message: "Key válida." });
}
