export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, boolean> = {
    MONGO_URI:           !!process.env.MONGO_URI,
    ADMIN_USERNAME:      !!process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD_HASH: !!process.env.ADMIN_PASSWORD_HASH,
    JWT_SECRET:          !!process.env.JWT_SECRET,
    JWT_REFRESH_SECRET:  !!process.env.JWT_REFRESH_SECRET,
    WEBHOOK_URL:         !!process.env.WEBHOOK_URL,
  };

  const required = ["MONGO_URI","ADMIN_USERNAME","ADMIN_PASSWORD_HASH","JWT_SECRET","JWT_REFRESH_SECRET"];
  const allOk = required.every((k) => checks[k]);

  return NextResponse.json({
    ok: allOk,
    env: checks,
    hint: allOk
      ? "Todas as variáveis obrigatórias estão configuradas."
      : "Variáveis marcadas como false precisam ser configuradas no Vercel.",
  }, { status: allOk ? 200 : 500 });
}
