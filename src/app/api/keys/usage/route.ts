export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { KeyUsage } from "@/models";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try { requireAuth(req); } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  await dbConnect();
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Key obrigatória." }, { status: 400 });
  const usage = await KeyUsage.find({ key }).sort({ timestamp: -1 }).limit(200).lean();
  return NextResponse.json({ usage });
}
