export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Key, Log, KeyUsage } from "@/models";
import { requireAuth } from "@/lib/auth";
import { subDays, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try { requireAuth(req); } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  await dbConnect();

  const [totalActive, totalExpired, totalDeleted] = await Promise.all([
    Key.countDocuments({ status: "active" }),
    Key.countDocuments({ status: "expired" }),
    Key.countDocuments({ status: "deleted" }),
  ]);

  const last14Days = Array.from({ length: 14 }, (_, i) => startOfDay(subDays(new Date(), 13 - i)));

  const executionsByDay = await Promise.all(
    last14Days.map(async (day) => {
      const next  = new Date(day.getTime() + 86_400_000);
      const count = await Log.countDocuments({ type: "execution", timestamp: { $gte: day, $lt: next } });
      return { date: day.toISOString().slice(0, 10), count };
    })
  );

  const since7d      = subDays(new Date(), 7);
  const uniqueHwids  = await KeyUsage.distinct("hwid", { timestamp: { $gte: since7d } });

  return NextResponse.json({ totalActive, totalExpired, totalDeleted, executionsByDay, uniqueHwids7d: uniqueHwids.length });
}
