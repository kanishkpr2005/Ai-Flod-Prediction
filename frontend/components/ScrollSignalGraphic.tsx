"use client";

import { useEffect, useState } from "react";

export default function ScrollSignalGraphic() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollableHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const nextProgress = scrollableHeight > 0
          ? window.scrollY / scrollableHeight
          : 0;

        setProgress(Math.min(1, Math.max(0, nextProgress)));
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  const sweepRotation = -28 + progress * 150;
  const routeOffset = 260 - progress * 260;

  return (
    <div
      className="scroll-signal border-b border-cyan-400/10 bg-[#07151d]"
      style={{ "--signal-progress": progress } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="mx-auto flex h-28 max-w-7xl items-center gap-5 px-6 sm:h-36">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-cyan-300/25 bg-[#0a2028] sm:h-24 sm:w-24">
          <span className="absolute inset-1 rounded-full border border-cyan-300/10" />
          <span className="absolute inset-[22%] rounded-full border border-cyan-300/15" />
          <span
            className="absolute left-1/2 top-1/2 h-1/2 w-px origin-bottom bg-cyan-300/80"
            style={{ transform: `translate(-50%, -100%) rotate(${sweepRotation}deg)` }}
          />
          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_14px_4px_rgba(103,232,249,0.7)]" />
          <span className="absolute left-[63%] top-[27%] h-1.5 w-1.5 rounded-full bg-lime-300" />
          <span className="absolute left-[25%] top-[63%] h-1.5 w-1.5 rounded-full bg-orange-300" />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="mb-3 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/60">
            <span>Live response network</span>
            <span>{Math.round(progress * 100)}% scanned</span>
          </div>
          <div className="relative h-10">
            <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-cyan-100/15" />
            <div
              className="scroll-signal-route absolute left-0 top-1/2 h-px bg-gradient-to-r from-cyan-300 via-lime-300 to-orange-300"
              style={{ transform: `translateX(${routeOffset}px)` }}
            />
            {["18%", "47%", "76%"].map((position, index) => (
              <span
                key={position}
                className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-[#07151d] ${index === 1 ? "bg-lime-300" : "bg-cyan-300"}`}
                style={{ left: position, opacity: 0.45 + progress * 0.55 }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] uppercase tracking-[0.18em] text-slate-500">
            <span>Signal intake</span>
            <span>Field teams</span>
            <span>Safe zones</span>
          </div>
        </div>
      </div>
    </div>
  );
}