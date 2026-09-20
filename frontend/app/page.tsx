"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const LandingMap = dynamic(
  () => import("@/components/LandingMap"),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-800/70 bg-slate-950/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* LOGO */}

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-2xl">
              🌐
            </div>

            <div>
              <h1 className="text-lg font-bold">
                Rakshak Ai
              </h1>

              <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400">
                Smart Emergency Response
              </p>
            </div>
          </Link>

          {/* NAVIGATION */}

          <nav className="hidden items-center gap-8 md:flex">

            <a
              href="#about"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              About
            </a>

            <a
              href="#features"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              How It Works
            </a>

          </nav>

          {/* LOGIN BUTTON */}

          <Link
            href="/login"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 hover:shadow-blue-500/30"
          >
            Login
          </Link>

        </div>

      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative flex min-h-[760px] items-center overflow-hidden pt-20 md:min-h-[680px]">

        {/* BACKGROUND */}

        <div className="absolute inset-0">

          <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />

          <div className="absolute right-0 top-1/2 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[120px]" />

        </div>

        <div className="relative mx-auto grid max-w-7xl gap-8 px-6 py-14 md:grid-cols-[0.9fr_1.1fr] md:items-center lg:gap-14 lg:py-20">

          {/* LEFT */}

          <div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-4 py-2 text-xs font-semibold text-green-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              AI-POWERED DISASTER MONITORING
            </div>

            <h2 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl md:text-5xl lg:text-6xl">

              Predict.
              <br />

              <span className="text-blue-500">
                Protect.
              </span>

              <br />

              Respond.

            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 lg:text-lg lg:leading-8">

              An intelligent disaster management platform that
              continuously monitors weather conditions, predicts
              flood risks, generates emergency alerts and helps
              authorities coordinate rescue operations.

            </p>

            <div className="mt-7 flex flex-wrap gap-3 lg:mt-9 lg:gap-4">

              <Link
                href="/login"
                className="rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold transition hover:bg-blue-500"
              >
                Access Control Center →
              </Link>

              <a
                href="#about"
                className="rounded-xl border border-slate-700 bg-slate-900 px-7 py-3.5 text-sm font-bold transition hover:border-slate-600 hover:bg-slate-800"
              >
                Explore Platform
              </a>

            </div>

          </div>

          {/* RIGHT SYSTEM CARD */}

          <div className="relative">

            <div className="rounded-3xl border border-red-500/20 bg-[#111111]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:p-6">

              <div className="mb-6 flex items-center justify-between">

                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    System Status
                  </p>

                  <p className="mt-1 text-lg font-bold">
                    Disaster Monitoring Center
                  </p>
                </div>

                <div className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-400">
                  ● LIVE
                </div>

              </div>

              {/* INDIA GIS MAP */}

              <div className="relative h-[300px] overflow-hidden rounded-2xl border border-red-500/20 bg-slate-950 lg:h-[350px]">
                <LandingMap />

              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <LandingSignal
                  label="Coverage"
                  value="India"
                  detail="Multi-region GIS"
                  tone="text-cyan-300"
                />
                <LandingSignal
                  label="Signals"
                  value="Weather + AI"
                  detail="Risk intelligence"
                  tone="text-orange-300"
                />
                <LandingSignal
                  label="Response"
                  value="SOS ready"
                  detail="Teams on call"
                  tone="text-green-300"
                />
              </div>

              {/* STATS */}

              <div className="mt-5 grid grid-cols-3 gap-3">

                <div className="rounded-xl bg-slate-950 p-4">

                  <p className="text-2xl font-bold text-red-400">
                    AI
                  </p>

                  <p className="mt-1 text-[10px] uppercase text-slate-500">
                    Prediction
                  </p>

                </div>

                <div className="rounded-xl bg-slate-950 p-4">

                  <p className="text-2xl font-bold text-orange-400">
                    24/7
                  </p>

                  <p className="mt-1 text-[10px] uppercase text-slate-500">
                    Monitoring
                  </p>

                </div>

                <div className="rounded-xl bg-slate-950 p-4">

                  <p className="text-2xl font-bold text-green-400">
                    LIVE
                  </p>

                  <p className="mt-1 text-[10px] uppercase text-slate-500">
                    Alerts
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          ABOUT
      ===================================================== */}

      <section
        id="about"
        className="border-t border-slate-800 bg-slate-900/40 py-24"
      >

        <div className="mx-auto max-w-7xl px-6">

          <div className="max-w-3xl">

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
              About The Platform
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Intelligent disaster response for a safer India
            </h2>

            <p className="mt-6 leading-8 text-slate-400">

              Our platform combines artificial intelligence,
              weather intelligence, rainfall analysis, GIS
              visualization and emergency response management
              into one centralized system.

            </p>

            <p className="mt-4 leading-8 text-slate-400">

              Instead of waiting for a disaster to happen,
              the system continuously analyzes available
              environmental information and identifies areas
              where flood risk may be increasing.

            </p>

          </div>

        </div>

      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}

      <section
        id="features"
        className="py-24"
      >

        <div className="mx-auto max-w-7xl px-6">

          <div className="text-center">

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
              Platform Capabilities
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Everything needed for disaster response
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              A unified platform connecting prediction,
              monitoring, alerts and emergency response.
            </p>

          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            <FeatureCard
              icon="🤖"
              title="AI Risk Prediction"
              description="Machine learning models analyze rainfall and weather information to identify potential flood risk."
            />

            <FeatureCard
              icon="🌦️"
              title="Live Weather Monitoring"
              description="Continuously monitor weather conditions across monitored locations."
            />

            <FeatureCard
              icon="🗺️"
              title="GIS Risk Map"
              description="Visualize disaster risk, alerts and emergency locations on an interactive map."
            />

            <FeatureCard
              icon="🚨"
              title="Automatic Alerts"
              description="Automatically generate alerts when dangerous conditions or high-risk areas are detected."
            />

            <FeatureCard
              icon="🆘"
              title="Emergency SOS"
              description="Receive emergency SOS requests and monitor their response status."
            />

            <FeatureCard
              icon="🚑"
              title="Rescue Coordination"
              description="Help authorities monitor rescue teams, volunteers and emergency response resources."
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section
        id="how-it-works"
        className="border-y border-slate-800 bg-slate-900/40 py-24"
      >

        <div className="mx-auto max-w-7xl px-6">

          <div className="text-center">

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
              How It Works
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              From data to emergency response
            </h2>

          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-4">

            <ProcessCard
              number="01"
              icon="📡"
              title="Monitor"
              description="Collect weather, rainfall and environmental information."
            />

            <ProcessCard
              number="02"
              icon="🧠"
              title="Predict"
              description="AI models calculate disaster risk for locations."
            />

            <ProcessCard
              number="03"
              icon="🚨"
              title="Alert"
              description="High-risk conditions generate active disaster alerts."
            />

            <ProcessCard
              number="04"
              icon="🚑"
              title="Respond"
              description="Authorities coordinate SOS requests and response teams."
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          LOGIN CTA
      ===================================================== */}

      <section className="py-24">

        <div className="mx-auto max-w-5xl px-6">

          <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-10 text-center sm:p-14">

            <div className="text-5xl">
              🏛️
            </div>

            <h2 className="mt-5 text-3xl font-bold">
              Ready to enter the control center?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Authorized users can log in to access live
              disaster monitoring, alerts, SOS requests
              and emergency response tools.
            </p>

            <Link
              href="/login"
              className="mt-8 inline-flex rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-bold transition hover:bg-blue-500"
            >
              Login to Dashboard →
            </Link>

          </div>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-slate-800 bg-slate-950">

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">

          <p>
            © 2026 Rakshak Ai
          </p>

          <p>
            AI • GIS • Weather Intelligence • Emergency Response
          </p>

        </div>

      </footer>

    </main>
  );
}

/* ============================================================
   FEATURE CARD
============================================================ */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-blue-500/30">

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-bold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {description}
      </p>

    </div>
  );
}

/* ============================================================
   PROCESS CARD
============================================================ */

function ProcessCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

      <div className="flex items-center justify-between">

        <span className="text-xs font-bold text-slate-600">
          {number}
        </span>

        <span className="text-2xl">
          {icon}
        </span>

      </div>

      <h3 className="mt-6 text-lg font-bold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {description}
      </p>

    </div>
  );
}

function LandingSignal({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className="border-l-2 border-slate-700 bg-slate-950/80 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">{label}</p>
      <p className={`mt-1 text-sm font-bold ${tone}`}>{value}</p>
      <p className="mt-1 text-[10px] text-slate-500">{detail}</p>
    </div>
  );
}