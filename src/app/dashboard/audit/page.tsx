"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { BookOpen } from "lucide-react";

interface AuditEntry {
  _id: string;
  action: string;
  detail?: string;
  adminIp: string;
  timestamp: string;
}

const actionColors: Record<string, string> = {
  create_key:       "text-violet-400",
  delete_key:       "text-red-400",
  restore_key:      "text-amber-400",
  blacklist_add:    "text-red-300",
  blacklist_remove: "text-emerald-400",
};

export default function AuditPage() {
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  useEffect(() => {
    fetch("/api/audit").then(r => r.json()).then(d => setAudit(d.audit ?? []));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white font-mono">Auditoria</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Todas as ações realizadas no painel</p>
      </div>

      <div className="bg-[#0d1117] border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
              {["Ação", "Detalhe", "IP do Admin", "Horário"].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {audit.map(a => (
              <tr key={a._id} className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition">
                <td className={`px-4 py-3 font-mono font-semibold ${actionColors[a.action] ?? "text-zinc-400"}`}>
                  {a.action.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-400">{a.detail ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{a.adminIp}</td>
                <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                  {format(new Date(a.timestamp), "dd/MM/yyyy HH:mm:ss")}
                </td>
              </tr>
            ))}
            {audit.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-600 text-sm">Nenhuma ação registrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
