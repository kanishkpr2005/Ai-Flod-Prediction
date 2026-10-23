"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  Activity,
  Compass,
  Cpu,
  AlertTriangle,
  Radio,
  LifeBuoy,
  TrendingUp,
  LogOut,
  Layers,
  ChevronRight,
} from "lucide-react";

export type AuthorityTab =
  | "overview"
  | "map"
  | "predictions"
  | "alerts"
  | "sos"
  | "rescue"
  | "analytics";

interface Props {
  activeTab?: AuthorityTab;
  onSelectTab?: (tab: AuthorityTab) => void;
  liveAlertCount?: number;
  activeSosCount?: number;
}

const menuItems: { id: AuthorityTab; name: string; href: string; icon: any }[] = [
  { id: "overview", name: "Command Overview", href: "/authority-dashboard?tab=overview", icon: Activity },
  { id: "map", name: "Live Flood Map", href: "/authority-dashboard?tab=map", icon: Compass },
  { id: "predictions", name: "AI Flood Intelligence", href: "/authority-dashboard?tab=predictions", icon: Cpu },
  { id: "alerts", name: "Active Alerts", href: "/authority-dashboard?tab=alerts", icon: AlertTriangle },
  { id: "sos", name: "Emergency SOS", href: "/authority-dashboard?tab=sos", icon: Radio },
  { id: "rescue", name: "Rescue Operations", href: "/authority-dashboard?tab=rescue", icon: LifeBuoy },
  { id: "analytics", name: "Risk Analytics", href: "/authority-dashboard?tab=analytics", icon: TrendingUp },
];

export default function AuthoritySidebar({
  activeTab = "overview",
  onSelectTab,
  liveAlertCount = 0,
  activeSosCount = 0,
}: Props) {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("disaster_user");
      router.push("/login");
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 border-r border-slate-800 bg-[#070b14] lg:flex flex-col">
      
      {/* BRANDING HEADER */}
      <div className="border-b border-slate-800 p-5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-md">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight">
              AI Flood Prediction
            </h1>
            <p className="text-[10px] tracking-wider uppercase text-blue-400 font-mono">
              Authority Command
            </p>
          </div>
        </Link>
      </div>

      {/* NAVIGATION ITEMS */}
      <div className="flex-1 overflow-y-auto px-3.5 pt-5 pb-4">
        <p className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
          Operations Center
        </p>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (onSelectTab) {
                    onSelectTab(item.id);
                  } else {
                    router.push(item.href);
                  }
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:bg-slate-900/80 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </div>

                {item.id === "alerts" && liveAlertCount > 0 && (
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                    {liveAlertCount}
                  </span>
                )}

                {item.id === "sos" && activeSosCount > 0 && (
                  <span className="rounded-full bg-red-500/20 border border-red-500/40 px-1.5 py-0.2 text-[9px] font-bold text-red-300 animate-pulse">
                    {activeSosCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* SYSTEM STATUS CARD */}
      <div className="p-3.5 border-t border-slate-800/80">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>GRID OPERATIONAL</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">590 DIST</span>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 leading-relaxed">
            Continuous 30-min numerical precipitation cycle active.
          </p>
        </div>

        {/* LOGOUT BUTTON */}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-red-500/40 hover:bg-red-950/20 hover:text-red-300"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Exit Command Center</span>
        </button>
      </div>

    </aside>
  );
}