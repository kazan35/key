"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Key, FileText, Shield, BookOpen } from "lucide-react";

const nav = [
  { href: "/dashboard",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/dashboard/keys",      label: "Keys",       icon: Key },
  { href: "/dashboard/logs",      label: "Logs",       icon: FileText },
  { href: "/dashboard/blacklist", label: "Blacklist",  icon: Shield },
  { href: "/dashboard/audit",     label: "Auditoria",  icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#0d1117] border-r border-zinc-800 flex flex-col z-50">
      <div className="px-6 py-6 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <Key size={15} className="text-violet-400" />
          </div>
          <span className="font-mono font-bold text-white tracking-wider text-sm">APEX KEYS</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
