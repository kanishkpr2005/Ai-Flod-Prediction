"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Live Disaster Map", href: "/map", icon: "🗺️" },
  { name: "AI Predictions", href: "/predictions", icon: "🤖" },
  { name: "Alerts", href: "/alerts", icon: "🚨" },
  { name: "Emergency SOS", href: "/sos", icon: "🆘" },
  { name: "Rescue Teams", href: "/rescue", icon: "🚑" },
  { name: "Analytics", href: "/analytics", icon: "📈" },
];

export default function AuthoritySidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 border-r border-slate-800 bg-slate-950 lg:block">

      <div className="flex h-full flex-col">

        {/* LOGO */}

        <div className="border-b border-slate-800 p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-xl shadow-lg shadow-red-900/30">
              🛡️
            </div>

            <div>
              <h1 className="font-bold text-white">
                Disaster AI
              </h1>

              <p className="text-xs text-slate-500">
                Authority Control
              </p>
            </div>

          </div>

        </div>

        {/* SYSTEM */}

        <div className="px-4 pt-5">

          <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Command Center
          </p>

          <nav className="space-y-1">

            {menu.map((item) => {

              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-red-600 text-white shadow-lg shadow-red-900/20"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <span className="text-lg">
                    {item.icon}
                  </span>

                  <span>
                    {item.name}
                  </span>

                  {item.name === "Alerts" && (
                    <span className="ml-auto rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                      LIVE
                    </span>
                  )}

                </Link>
              );
            })}

          </nav>

        </div>

        {/* SYSTEM STATUS */}

        <div className="mt-auto p-4">

          <div className="rounded-xl border border-green-500/20 bg-green-950/20 p-4">

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />

              <span className="text-xs font-bold text-green-400">
                SYSTEM ONLINE
              </span>

            </div>

            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              AI prediction and disaster monitoring pipeline active.
            </p>

          </div>

        </div>

      </div>

    </aside>
  );
}