"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { name: "Home", href: "/dashboard", icon: "📊" },
  { name: "Map", href: "/map", icon: "🗺️" },
  { name: "AI", href: "/predictions", icon: "🤖" },
  { name: "Alerts", href: "/alerts", icon: "🚨" },
  { name: "SOS", href: "/sos", icon: "🆘" },
];

export default function AuthorityMobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur lg:hidden">

      <div className="grid grid-cols-5">

        {menu.map((item) => {

          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-3 text-[10px] ${
                active
                  ? "text-red-400"
                  : "text-slate-500"
              }`}
            >

              <span className="text-lg">
                {item.icon}
              </span>

              <span>
                {item.name}
              </span>

            </Link>
          );
        })}

      </div>

    </div>
  );
}