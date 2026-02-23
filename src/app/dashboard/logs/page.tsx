"use client";

import { useEffect, useState } from "react";
import { Download, Filter } from "lucide-react";
import { format } from "date-fns";

interface Log {
  _id: string;
  type: string;
  key?: string;
  robloxNick?: string;
  hwid?: string;
  ip?: string;
  message?: string;
  timestamp: string;
}

const typeColors: Record<string, string> = {
  execution:        "text-emerald-400",
  create:           "text-violet-400",
  delete:           "text-red-400",
  restore:          "text-amber-400",
  invalid_attempt:  "text-orange-400",
  blocked_attempt:  "text-red-300",
  admin_action:     "text-zinc-400",
};

export default function LogsPage() {
  const [logs, setLogs]   = useState<Log[]>([]);
  const [filter, setFilter] = useState("all");

  async function load() {
    const q = filter !== "all" ? `?type=${filter}` : "";
    const r = await fetch(`/api/logs${q}`);
    const d = await r.json();
    setLogs(d.logs ?? []);
  }

  useEffect(() => { load(); }, [filter]);

  function exportLogs(fmt: "csv" | "json") {
    const q = filter !== "all" ? `&type=${filter}` : "";
    window.open(`/api/logs?format=${fmt}${q}&limit=1000`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-mono">Logs</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{logs.length} registros</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportLogs("csv")} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-2 rounded-xl transition">
            <Download size={14} /> CSV
          </button>
          <button onClick={() => exportLogs("json")} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-2 rounded-xl transition">
            <Download size={14} /> JSON
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 flex-wrap">
        {["all", "execution", "create", "delete", "restore", "invalid_attempt", "blocked_attempt"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {f === "all" ? "Todos" : f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Log list */}
      <div className="bg-[#0d1117] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                {["Tipo", "Key", "Nick Roblox", "HWID", "IP", "Mensagem", "Horário"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l._id} className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition">
                  <td className={`px-4 py-2.5 font-mono font-semibold ${typeColors[l.type] ?? "text-zinc-400"}`}>{l.type}</td>
                  <td className="px-4 py-2.5 font-mono text-violet-300">{l.key ? l.key.slice(0, 16) + "…" : "—"}</td>
                  <td className="px-4 py-2.5 text-zinc-300">{l.robloxNick ?? "—"}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{l.hwid ? l.hwid.slice(0, 12) + "…" : "—"}</td>
                  <td className="px-4 py-2.5 text-zinc-400">{l.ip ?? "—"}</td>
                  <td className="px-4 py-2.5 text-zinc-500 max-w-[180px] truncate">{l.message ?? "—"}</td>
                  <td className="px-4 py-2.5 text-zinc-500 font-mono whitespace-nowrap">
                    {format(new Date(l.timestamp), "dd/MM HH:mm:ss")}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-600">Nenhum log.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
