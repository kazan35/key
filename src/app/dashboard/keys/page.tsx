"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, RotateCcw, Copy, History, X } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Key {
  _id: string;
  key: string;
  status: string;
  durationType: string;
  durationValue?: number;
  expiresAt?: string;
  deletedAt?: string;
  robloxNick?: string;
  hwid?: string;
  ip?: string;
  note?: string;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
}

interface Usage {
  _id: string;
  key: string;
  hwid?: string;
  ip?: string;
  robloxNick?: string;
  timestamp: string;
}

}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    expired: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    deleted: "bg-red-500/15 text-red-400 border-red-500/20",
    banned:  "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  };
  return map[status] ?? "bg-zinc-500/15 text-zinc-400";
}

export default function KeysPage() {
  const [keys, setKeys]               = useState<Key[]>([]);
  const [showCreate, setShowCreate]   = useState(false);
  const [showUsage, setShowUsage]     = useState<string | null>(null);
  const [usageLogs, setUsageLogs]     = useState<Usage[]>([]);
  const [filter, setFilter]           = useState("all");
  const [durationType, setDurationType] = useState<"minutes" | "days" | "permanent">("permanent");
  const [durationValue, setDurationValue] = useState("");
  const [note, setNote]               = useState("");
  const [restoreTarget, setRestoreTarget] = useState<Key | null>(null);
  const [restoreDuration, setRestoreDuration] = useState<"minutes" | "days" | "permanent">("days");
  const [restoreValue, setRestoreValue] = useState("30");
  const [loading, setLoading]         = useState(false);

  async function loadKeys() {
    const q = filter !== "all" ? `?status=${filter}` : "";
    const r = await fetch(`/api/keys${q}`);
    const d = await r.json();
    setKeys(d.keys ?? []);
  }

  useEffect(() => { loadKeys(); }, [filter]);

  async function createKey() {
    setLoading(true);
    const body: Record<string, unknown> = { durationType, note: note || undefined };
    if (durationType !== "permanent" && durationValue) body.durationValue = Number(durationValue);

    await fetch("/api/keys", {
      method: "POST",
      body: JSON.stringify(body),
    });

    setShowCreate(false);
    setNote("");
    setDurationValue("");
    loadKeys();
    setLoading(false);
  }

  async function deleteKey(id: string) {
    if (!confirm("Apagar esta key?")) return;
    await fetch(`/api/keys?id=${id}`, {
      method: "DELETE",
    });
    loadKeys();
  }

  async function restoreKey() {
    if (!restoreTarget) return;
    setLoading(true);
    const body: Record<string, unknown> = { id: restoreTarget._id, durationType: restoreDuration };
    if (restoreDuration !== "permanent" && restoreValue) body.durationValue = Number(restoreValue);

    await fetch("/api/keys", {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    setRestoreTarget(null);
    loadKeys();
    setLoading(false);
  }

  async function loadUsage(key: string) {
    const r = await fetch(`/api/keys/usage?key=${encodeURIComponent(key)}`);
    const d = await r.json();
    setUsageLogs(d.usage ?? []);
    setShowUsage(key);
  }

  const filtered = keys.filter(k => filter === "all" || k.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-mono">Keys</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{filtered.length} keys encontradas</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Plus size={15} /> Nova Key
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1 w-fit">
        {["all", "active", "expired", "deleted"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${filter === f ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >{f === "all" ? "Todas" : f}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0d1117] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                {["Key", "Status", "Nick Roblox", "HWID", "Duração", "Expira / Expira em", "Usos", "Nota", "Ações"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((k) => (
                <tr key={k._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-violet-300 font-mono text-xs">{k.key}</code>
                      <button onClick={() => navigator.clipboard.writeText(k.key)} className="text-zinc-600 hover:text-zinc-300 transition">
                        <Copy size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${statusBadge(k.status)}`}>
                      {k.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{k.robloxNick ?? "-"}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-zinc-500">{k.hwid ? k.hwid.slice(0, 16) + "…" : "-"}</code>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 capitalize">
                    {k.durationType === "permanent" ? "Permanente" : `${k.durationValue} ${k.durationType}`}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {k.expiresAt
                      ? formatDistanceToNow(new Date(k.expiresAt), { addSuffix: true, locale: ptBR })
                      : k.status === "permanent" ? "—" : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 font-mono">{k.usageCount}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs max-w-[120px] truncate">{k.note ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button title="Histórico" onClick={() => loadUsage(k.key)} className="text-zinc-600 hover:text-cyan-400 transition">
                        <History size={14} />
                      </button>
                      {(k.status === "expired" || k.status === "deleted") && (
                        <button title="Restaurar" onClick={() => setRestoreTarget(k)} className="text-zinc-600 hover:text-amber-400 transition">
                          <RotateCcw size={14} />
                        </button>
                      )}
                      <button title="Apagar" onClick={() => deleteKey(k._id)} className="text-zinc-600 hover:text-red-400 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-zinc-600 text-sm">Nenhuma key encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Criar Key */}
      {showCreate && (
        <Modal title="Nova Key" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Duração</label>
              <select value={durationType} onChange={e => setDurationType(e.target.value as any)}
                className="input w-full">
                <option value="permanent">Permanente</option>
                <option value="days">Dias</option>
                <option value="minutes">Minutos</option>
              </select>
            </div>
            {durationType !== "permanent" && (
              <div>
                <label className="label">Quantidade</label>
                <input type="number" value={durationValue} onChange={e => setDurationValue(e.target.value)}
                  className="input w-full" placeholder="Ex: 30" min="1" />
              </div>
            )}
            <div>
              <label className="label">Nota interna (opcional)</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)}
                className="input w-full" placeholder="Para quem é essa key..." />
            </div>
            <button onClick={createKey} disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50">
              {loading ? "Criando..." : "Criar Key"}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Restaurar Key */}
      {restoreTarget && (
        <Modal title="Restaurar Key" onClose={() => setRestoreTarget(null)}>
          <p className="text-xs text-zinc-400 mb-4 font-mono">{restoreTarget.key}</p>
          <div className="space-y-4">
            <div>
              <label className="label">Nova Duração</label>
              <select value={restoreDuration} onChange={e => setRestoreDuration(e.target.value as any)} className="input w-full">
                <option value="permanent">Permanente</option>
                <option value="days">Dias</option>
                <option value="minutes">Minutos</option>
              </select>
            </div>
            {restoreDuration !== "permanent" && (
              <div>
                <label className="label">Quantidade</label>
                <input type="number" value={restoreValue} onChange={e => setRestoreValue(e.target.value)}
                  className="input w-full" min="1" />
              </div>
            )}
            <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              Só o HWID e IP originais poderão usar esta key.
            </p>
            <button onClick={restoreKey} disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50">
              {loading ? "Restaurando..." : "Restaurar"}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Histórico de uso */}
      {showUsage && (
        <Modal title={`Histórico — ${showUsage}`} wide onClose={() => setShowUsage(null)}>
          <div className="max-h-80 overflow-y-auto space-y-1.5">
            {usageLogs.length === 0 && <p className="text-sm text-zinc-500 text-center py-4">Nenhum uso registrado.</p>}
            {usageLogs.map(u => (
              <div key={u._id} className="flex items-center justify-between text-xs bg-zinc-900 rounded-lg px-3 py-2">
                <span className="text-zinc-300">{u.robloxNick ?? "—"}</span>
                <span className="text-zinc-500 font-mono">{u.ip}</span>
                <span className="text-zinc-500">{format(new Date(u.timestamp), "dd/MM HH:mm:ss")}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-[#0d1117] border border-zinc-800 rounded-2xl p-6 w-full shadow-2xl ${wide ? "max-w-xl" : "max-w-sm"}`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
