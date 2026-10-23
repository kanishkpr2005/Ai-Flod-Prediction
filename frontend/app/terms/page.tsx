"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, FileText, AlertOctagon, CheckCircle2 } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="font-bold text-white text-sm">
              AI Flood Prediction Platform
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-white hover:border-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Platform</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
            <FileText className="h-4 w-4" />
            <span>Legal & Operational Terms</span>
          </div>
          <h1 className="text-3xl font-black text-white sm:text-4xl">Terms of Service & Advisory Notice</h1>
          <p className="mt-2 text-xs text-slate-400">
            Operational Guidelines for Citizens, Rescue Teams, and Disaster Authorities
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          
          <section className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6">
            <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2 mb-2">
              <AlertOctagon className="h-5 w-5 text-amber-400" />
              1. Early Warning Decision Support Disclaimer
            </h2>
            <p className="text-xs sm:text-sm text-slate-200">
              The AI Flood Prediction Platform provides predictive risk assessments based on statistical machine learning
              (Random Forest) and numerical weather predictions. While designed with high empirical fidelity (93.8% test accuracy),
              predictions represent early-warning decision support and do not supersede statutory evacuation orders issued by the
              National Disaster Management Authority (NDMA), State Disaster Management Authorities (SDMA), or district collectors.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">2. Acceptable Use of Emergency SOS</h2>
            <p className="text-xs sm:text-sm">
              The One-Tap Emergency SOS service is reserved strictly for genuine life-threatening emergencies, flood entrapment,
              and evacuation assistance. False alarms, test triggers on non-testing accounts, or abusive automated requests
              degrade emergency unit response times and are subject to immediate account termination.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">3. Authority & Responder Obligations</h2>
            <p className="text-xs sm:text-sm">
              Disaster management operators and unit commanders accessing the Authority Command Center agree to maintain the
              confidentiality of citizen distress telemetry and update unit availability statuses in real time to ensure
              accurate tactical situational awareness across the command grid.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">4. System Availability & Telemetry Uptime</h2>
            <p className="text-xs sm:text-sm">
              The platform implements continuous automatic monitoring cycles every 30 minutes. In the event of network disruption
              or upstream weather API downtime, the system falls back to historical antecedent precipitation vectors and local
              contingency baselines.
            </p>
          </section>

        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 text-xs text-slate-500 flex justify-between">
          <span>AI Flood Prediction Platform</span>
          <span>Legal: legal@platform.local</span>
        </div>
      </div>
    </main>
  );
}
