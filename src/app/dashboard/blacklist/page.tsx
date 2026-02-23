"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, ShieldBan } from "lucide-react";

interface BLEntry {
  _id: string;
  type: string;
  value: string;
  reason?: string;
  createdAt: string;
}

}

export default function BlacklistPage() {
  const [list, setList]     = useState<BLEntry[]>([]);
  const [show, setShow]     = useState(false);
  const [type, setType]     = useState<"hwid" | "ip" | "robloxNick">("hwid");
  const [value, setValue]   = useState("");
  const [reason, setReason] = useState("");

  async function load() {
    const r = await fetch("/api/blacklist");
    const d = await r.json();
    setList(d.list ?? []);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    await fetch("/api/blacklist", {
      method: "POST",
      body: JSON.stringify({ type, value, reason: reason || undefined }),
    });
    setShow(false);
    setValue("");
    setReason("");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/blacklist?id=${id}`, {
      method: "DELETE",
    });
    load();
  }

  const typeLabel: Record<string, string> = { hwid: "HWID", ip: "IP", robloxNick: "Nick Roblox" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-mono">Blacklist</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{list.length} entradas</p>
        </div>
        <button onClick={() => setShow(true)}
          className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">
          <ShieldBan size={15} /> Adicionar
        </button>
      </div>

      <div className="bg-[#0d1117] border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
              {["Tipo", "Valor", "Motivo", "Adicionado em", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map(e => (
              <tr key={e._id} className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition">
                <td className="px-4 py-3">
                  <span className="text-xs font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                    {typeLabel[e.type]}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-300">{e.value}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{e.reason ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(e.createdAt).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3">
                  <button onClick={() => remove(e._id)} className="text-zinc-600 hover:text-red-400 transition">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-600 text-sm">Nenhuma entrada na blacklist.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Adicionar à Blacklist</h2>
              <button onClick={() => setShow(false)} className="text-zinc-600 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Tipo</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="input w-full">
                  <option value="hwid">HWID</option>
                  <option value="ip">IP</option>
                  <option value="robloxNick">Nick Roblox</option>
                </select>
              </div>
              <div>
                <label className="label">Valor</label>
                <input value={value} onChange={e => setValue(e.target.value)} className="input w-full" placeholder="Cole o valor aqui..." />
              </div>
              <div>
                <label className="label">Motivo (opcional)</label>
                <input value={reason} onChange={e => setReason(e.target.value)} className="input w-full" placeholder="Ex: cheater, ban permanente..." />
              </div>
              <button onClick={add}
                className="w-full bg-red-700 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl transition">
                Banir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
