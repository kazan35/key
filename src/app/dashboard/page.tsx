"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Key, Activity, Clock, Cpu } from "lucide-react";

interface Stats {
  totalActive: number;
  totalExpired: number;
  totalDeleted: number;
  executionsByDay: { date: string; count: number }[];
  uniqueHwids7d: number;
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-[#0d1117] border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold font-mono text-white mt-0.5">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs">
        <p className="text-zinc-400">{label}</p>
        <p className="text-violet-300 font-bold mt-0.5">{payload[0].value} execuções</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(setStats);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white font-mono">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Visão geral do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Keys Ativas"    value={stats?.totalActive    ?? 0} icon={Key}      color="bg-violet-500/15 text-violet-400" />
        <StatCard label="Expiradas"      value={stats?.totalExpired   ?? 0} icon={Clock}    color="bg-amber-500/15 text-amber-400" />
        <StatCard label="Deletadas"      value={stats?.totalDeleted   ?? 0} icon={Activity} color="bg-red-500/15 text-red-400" />
        <StatCard label="HWIDs (7d)"     value={stats?.uniqueHwids7d ?? 0} icon={Cpu}      color="bg-cyan-500/15 text-cyan-400" />
      </div>

      {/* Chart */}
      <div className="bg-[#0d1117] border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-5">Execuções por dia (14 dias)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={stats?.executionsByDay ?? []}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} fill="url(#grad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Keys status breakdown */}
      {stats && (
        <div className="bg-[#0d1117] border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Distribuição de Keys</h2>
          <div className="space-y-3">
            {[
              { label: "Ativas",    value: stats.totalActive,  color: "bg-violet-500", total: stats.totalActive + stats.totalExpired + stats.totalDeleted },
              { label: "Expiradas", value: stats.totalExpired, color: "bg-amber-500", total: stats.totalActive + stats.totalExpired + stats.totalDeleted },
              { label: "Deletadas", value: stats.totalDeleted, color: "bg-red-500",   total: stats.totalActive + stats.totalExpired + stats.totalDeleted },
            ].map(({ label, value, color, total }) => {
              const pct = total > 0 ? Math.round((value / total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>{label}</span>
                    <span className="font-mono">{value} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
