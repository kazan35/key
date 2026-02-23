export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@/lib/db";
import { Key, Log, Audit } from "@/models";
import { webhook } from "@/lib/webhook";

function getClientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const createSchema = z.object({
  durationType:  z.enum(["minutes", "days", "permanent"]),
  durationValue: z.number().positive().optional(),
  note:          z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  const keys = await Key.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { durationType, durationValue, note } = parsed.data;
  await dbConnect();

  let expiresAt: Date | undefined;
  if (durationType !== "permanent" && durationValue) {
    const ms = durationType === "minutes" ? durationValue * 60_000 : durationValue * 86_400_000;
    expiresAt = new Date(Date.now() + ms);
  }

  const key    = `APEX-${uuidv4().toUpperCase().replace(/-/g, "").slice(0, 20)}`;
  const record = await Key.create({ key, durationType, durationValue, expiresAt, note, status: "active" });

  const adminIp = getClientIp(req);
  await Log.create({ type: "create", key, adminIp, message: `Criada: ${durationType} ${durationValue ?? ""}` });
  await Audit.create({ action: "create_key", detail: key, adminIp });
  webhook.send({ type: "create", key, message: `Duração: ${durationType} ${durationValue ?? "permanente"}` });

  return NextResponse.json({ key: record }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const restoreSchema = z.object({
    id:            z.string(),
    durationType:  z.enum(["minutes", "days", "permanent"]),
    durationValue: z.number().positive().optional(),
  });

  const body   = await req.json().catch(() => null);
  const parsed = restoreSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  await dbConnect();
  const { id, durationType, durationValue } = parsed.data;
  const record = await Key.findById(id);
  if (!record) return NextResponse.json({ error: "Key não encontrada." }, { status: 404 });
  if (record.status !== "expired" && record.status !== "deleted") {
    return NextResponse.json({ error: "Só é possível restaurar keys expiradas." }, { status: 400 });
  }

  let expiresAt: Date | undefined;
  if (durationType !== "permanent" && durationValue) {
    const ms = durationType === "minutes" ? durationValue * 60_000 : durationValue * 86_400_000;
    expiresAt = new Date(Date.now() + ms);
  }

  await Key.updateOne({ _id: id }, { status: "active", durationType, durationValue, expiresAt, $unset: { deletedAt: "" } });

  const adminIp = getClientIp(req);
  await Audit.create({ action: "restore_key", detail: record.key, adminIp });
  webhook.send({ type: "restore", key: record.key, hwid: record.hwid, ip: record.ip, robloxNick: record.robloxNick });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

  await dbConnect();
  const record = await Key.findById(id);
  if (!record) return NextResponse.json({ error: "Key não encontrada." }, { status: 404 });

  await Key.updateOne({ _id: id }, { status: "deleted", deletedAt: new Date() });

  const adminIp = getClientIp(req);
  await Audit.create({ action: "delete_key", detail: record.key, adminIp });
  await Log.create({ type: "delete", key: record.key, adminIp });
  webhook.send({ type: "delete", key: record.key });

  return NextResponse.json({ ok: true });
}
