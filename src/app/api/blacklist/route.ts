export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { Blacklist, Audit } from "@/models";

function getClientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const createSchema = z.object({
  type:   z.enum(["hwid", "ip", "robloxNick"]),
  value:  z.string().min(1).max(300),
  reason: z.string().max(500).optional(),
});

export async function GET() {
  await dbConnect();
  const list = await Blacklist.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ list });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  await dbConnect();
  const entry = await Blacklist.create(parsed.data).catch(() => null);
  if (!entry) return NextResponse.json({ error: "Já está na blacklist." }, { status: 409 });

  await Audit.create({ action: "blacklist_add", detail: `${parsed.data.type}:${parsed.data.value}`, adminIp: getClientIp(req) });
  return NextResponse.json({ entry }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

  await dbConnect();
  const entry = await Blacklist.findByIdAndDelete(id);
  if (!entry) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  await Audit.create({ action: "blacklist_remove", detail: `${entry.type}:${entry.value}`, adminIp: getClientIp(req) });
  return NextResponse.json({ ok: true });
}
