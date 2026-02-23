export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Log } from "@/models";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try { requireAuth(req); } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  await dbConnect();

  const { searchParams } = req.nextUrl;
  const type   = searchParams.get("type");
  const format = searchParams.get("format");
  const limit  = Math.min(Number(searchParams.get("limit") ?? 200), 1000);

  const filter: Record<string, unknown> = {};
  if (type) filter.type = type;

  const logs = await Log.find(filter).sort({ timestamp: -1 }).limit(limit).lean();

  if (format === "csv") {
    const header = "type,key,robloxNick,hwid,ip,message,timestamp\n";
    const rows   = logs
      .map((l) =>
        [l.type, l.key, l.robloxNick, l.hwid, l.ip, l.message, l.timestamp]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=logs.csv",
      },
    });
  }

  if (format === "json") {
    return new NextResponse(JSON.stringify(logs, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "attachment; filename=logs.json",
      },
    });
  }

  return NextResponse.json({ logs });
}
