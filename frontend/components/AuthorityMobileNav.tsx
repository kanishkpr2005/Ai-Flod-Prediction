"use client";

import { Activity, Compass, Cpu, AlertTriangle, Radio } from "lucide-react";
import type { AuthorityTab } from "./AuthoritySidebar";

interface Props {
  activeTab?: AuthorityTab;
  onSelectTab?: (tab: AuthorityTab) => void;
  liveAlertCount?: number;
  activeSosCount?: number;
}

const mobileItems: { id: AuthorityTab; name: string; icon: any }[] = [
  { id: "overview", name: "Overview", icon: Activity },
  { id: "map", name: "Map", icon: Compass },
  { id: "predictions", name: "AI Model", icon: Cpu },
  { id: "alerts", name: "Alerts", icon: AlertTriangle },
  { id: "sos", name: "SOS", icon: Radio },
];

export default function AuthorityMobileNav({
  activeTab = "overview",
  onSelectTab,
  liveAlertCount = 0,
  activeSosCount = 0,
}: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-[#070b14]/95 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 px-1 py-1">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab && onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition relative ${
                isActive ? "text-blue-400" : "text-slate-400 hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon className="h-4 w-4" />
                {item.id === "alerts" && liveAlertCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-amber-400" />
                )}
                {item.id === "sos" && activeSosCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                )}
              </div>
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}