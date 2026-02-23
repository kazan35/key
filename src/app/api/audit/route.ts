export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Audit } from "@/models";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try { requireAuth(req); } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  await dbConnect();
  const audit = await Audit.find().sort({ timestamp: -1 }).limit(500).lean();
  return NextResponse.json({ audit });
}
