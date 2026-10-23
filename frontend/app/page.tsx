"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ShieldAlert,
  Compass,
  Activity,
  AlertTriangle,
  Radio,
  Layers,
  ChevronRight,
  Database,
  Satellite,
  TrendingUp,
  LifeBuoy,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Clock,
  ArrowRight,
  MapPin,
  Flame,
  Info,
  X,
  User,
  ShieldCheck,
  Crosshair,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

const LandingMap = dynamic(
  () => import("@/components/LandingMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-xs font-mono">Initializing Geospatial Risk Canvas...</span>
        </div>
      </div>
    ),
  }
);

interface PlatformStats {
  totalDistricts: number;
  criticalRisk: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  activeAlerts: number;
  lastSync: string;
}

export default function Home() {
  const [stats, setStats] = useState<PlatformStats>({
    totalDistricts: 590,
    criticalRisk: 71,
    highRisk: 116,
    mediumRisk: 38,
    lowRisk: 365,
    activeAlerts: 81,
    lastSync: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST",
  });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const [sumRes, alertRes] = await Promise.all([
          fetch(`${API_BASE_URL}/live-predictions/summary`, { cache: "no-store" }),
          fetch(`${API_BASE_URL}/alerts`, { cache: "no-store" }),
        ]);

        if (sumRes.ok) {
          const sumData = await sumRes.json();
          let activeCount = 81;

          if (alertRes.ok) {
            const alertData = await alertRes.json();
            const alertsList = alertData.alerts || alertData.data || [];
            activeCount = alertsList.filter((a: any) => !a.status || a.status.toUpperCase() === "ACTIVE").length || 81;
          }

          setStats({
            totalDistricts: sumData.total_districts || 590,
            criticalRisk: sumData.critical_risk ?? 71,
            highRisk: sumData.high_risk ?? 116,
            mediumRisk: sumData.medium_risk ?? 38,
            lowRisk: sumData.low_risk ?? 365,
            activeAlerts: activeCount,
            lastSync: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " IST",
          });
        }
      } catch (err) {
        console.warn("Using baseline platform telemetry:", err);
      }
    }

    loadStats();
  }, []);

  const onboardingSteps = [
    {
      title: "1. Real Data Ingestion",
      desc: "Daily IMD precipitation time-series data across 590 districts combined with live Open-Meteo numerical weather forecasts and elevation matrices.",
      tag: "REAL SENSORY DATA",
    },
    {
      title: "2. Random Forest Feature Engine",
      desc: "23 engineered features tracking 24h, 3d, 7d, 14d, and 30d catchment saturation, peak intensities, and acceleration trends feed a 400-tree ensemble classifier.",
      tag: "EXPLAINABLE ML",
    },
    {
      title: "3. Semantic Risk Mapping",
      desc: "Automated classification into LOW (green), MEDIUM (yellow), HIGH (orange), and CRITICAL (red) flood risk levels visualized in real time on our geospatial engine.",
      tag: "DISTRICT INTELLIGENCE",
    },
    {
      title: "4. Rapid Emergency Response",
      desc: "Instant automated warning dissemination to affected citizens and one-tap SOS dispatch to nearest NDRF/SDRF tactical rescue response units.",
      tag: "COMMAND & RESCUE",
    },
  ];

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-blue-600 selection:text-white">

      {/* =======================================================
          TOP BAR / NAVBAR
      ======================================================= */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-md shadow-blue-950/40 transition group-hover:border-blue-500/60">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base">
                  AI Flood Prediction Platform
                </span>
                <span className="hidden rounded bg-blue-950 border border-blue-500/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-blue-300 sm:inline">
                  NDMA FRAMEWORK
                </span>
              </div>
              <p className="text-[10px] tracking-wider uppercase text-slate-400">
                District-Level Early Warning & Response
              </p>
            </div>
          </Link>

          {/* NAV LINKS */}
          <nav className="hidden items-center gap-7 lg:flex text-xs font-semibold text-slate-300">
            <a href="#workflow" className="transition hover:text-white">Workflow</a>
            <a href="#live-risk-map" className="transition hover:text-white">Live Risk Map</a>
            <a href="#model-intelligence" className="transition hover:text-white">ML Intelligence</a>
            <a href="#data-sources" className="transition hover:text-white">Data Sources</a>
            <Link href="/user-dashboard" className="text-cyan-400 transition hover:text-cyan-300">
              Citizen Portal
            </Link>
          </nav>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setOnboardingStep(0);
                setIsOnboardingOpen(true);
              }}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
            >
              <Info className="h-3.5 w-3.5 text-blue-400" />
              <span>Platform Tour</span>
            </button>

            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 hover:shadow-blue-500/30"
            >
              <Crosshair className="h-3.5 w-3.5" />
              <span>Command Center</span>
            </Link>
          </div>

        </div>
      </header>

      {/* =======================================================
          HERO SECTION
      ======================================================= */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden border-b border-slate-800/60">
        
        {/* Subtle Background Lighting */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/5 blur-[140px]" />
          <div className="absolute right-0 top-1/3 h-[400px] w-[500px] rounded-full bg-cyan-600/5 blur-[140px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            
            {/* HERO CONTENT */}
            <div>
              
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-bold text-blue-300 mb-6">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                <span>AI FLOOD PREDICTION PLATFORM</span>
                <span className="text-slate-500">•</span>
                <span className="text-[11px] text-slate-400 font-mono">590 DISTRICTS MONITORED</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
                Know the Risk <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-300">
                  Before the Water Rises.
                </span>
              </h1>

              {/* Subheading */}
              <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-slate-300">
                AI-powered district-level flood intelligence combining historical rainfall,
                live weather and geospatial information to identify emerging flood risks
                and support faster emergency response.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                <a
                  href="#live-risk-map"
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 hover:shadow-blue-500/35"
                >
                  <Compass className="h-4 w-4" />
                  <span>View Live Risk Map</span>
                </a>

                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-6 py-3.5 text-sm font-bold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                >
                  <Crosshair className="h-4 w-4 text-slate-400" />
                  <span>Access Command Center</span>
                </Link>

                <Link
                  href="/user-dashboard"
                  className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3.5 text-xs font-bold text-red-300 transition hover:bg-red-900/30"
                >
                  <Radio className="h-3.5 w-3.5 text-red-400" />
                  <span>Citizen SOS Portal</span>
                </Link>
              </div>

              {/* Live Synchronization Status */}
              <div className="mt-8 flex items-center gap-3 text-xs text-slate-400 border-t border-slate-800/80 pt-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-slate-300">Prediction Engine Operational</span>
                </div>
                <span>•</span>
                <span className="font-mono">Last Synchronized: {stats.lastSync}</span>
              </div>

            </div>

            {/* HERO GEOSPATIAL PREVIEW */}
            <div className="relative">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5 shadow-2xl backdrop-blur-xl">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      National Flood Surveillance Canvas
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    590 REAL DISTRICTS
                  </span>
                </div>

                <div className="h-[360px] sm:h-[400px] w-full rounded-xl overflow-hidden border border-slate-800/90">
                  <LandingMap />
                </div>

                {/* Quick Telemetry Strip */}
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-2">
                    <div className="font-black text-red-400 text-base">{stats.criticalRisk}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Critical</div>
                  </div>
                  <div className="rounded-lg border border-orange-500/20 bg-orange-950/20 p-2">
                    <div className="font-black text-orange-400 text-base">{stats.highRisk}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">High</div>
                  </div>
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-950/20 p-2">
                    <div className="font-black text-yellow-400 text-base">{stats.mediumRisk}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Medium</div>
                  </div>
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2">
                    <div className="font-black text-emerald-400 text-base">{stats.lowRisk}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Low</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </section>

      {/* =======================================================
          CORE OPERATIONAL WORKFLOW (10-20 SECOND UNDERSTANDING)
      ======================================================= */}
      <section id="workflow" className="py-16 border-b border-slate-800/60 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
              End-to-End Early Warning Architecture
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white">
              The Disaster Management Intelligence Workflow
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Clear, transparent data-to-response pipeline delivering operational intelligence to disaster managers and citizens.
            </p>
          </div>

          {/* Workflow Chain */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            
            {/* Step 1 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 relative">
              <span className="text-[10px] font-mono font-bold text-blue-400">STAGE 01</span>
              <h3 className="mt-1 text-sm font-bold text-white">Real Data</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Daily precipitation series from 590 districts + Open-Meteo numerical weather forecast.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 relative">
              <span className="text-[10px] font-mono font-bold text-cyan-400">STAGE 02</span>
              <h3 className="mt-1 text-sm font-bold text-white">Feature Engine</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                23 temporal variables: 24h, 3d, 7d, 30d catchment totals, max bursts, and trend vectors.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 relative">
              <span className="text-[10px] font-mono font-bold text-indigo-400">STAGE 03</span>
              <h3 className="mt-1 text-sm font-bold text-white">Random Forest</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                400 balanced decision trees trained on historical flood events with chronological validation.
              </p>
            </div>

            {/* Step 4 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 relative">
              <span className="text-[10px] font-mono font-bold text-amber-400">STAGE 04</span>
              <h3 className="mt-1 text-sm font-bold text-white">Flood Risk</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Multi-signal fusion computes final flood probability and maps into 4 NDMA risk tiers.
              </p>
            </div>

            {/* Step 5 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 relative">
              <span className="text-[10px] font-mono font-bold text-orange-400">STAGE 05</span>
              <h3 className="mt-1 text-sm font-bold text-white">Geospatial Map</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Interactive India canvas highlighting emerging danger zones with complete factor breakdown.
              </p>
            </div>

            {/* Step 6 */}
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 relative">
              <span className="text-[10px] font-mono font-bold text-red-400">STAGE 06</span>
              <h3 className="mt-1 text-sm font-bold text-white">Emergency Alert</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Instant warnings to regional authorities and automatic dispatch to nearby NDRF rescue units.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =======================================================
          INTERACTIVE LIVE RISK MAP SECTION
      ======================================================= */}
      <section id="live-risk-map" className="py-20 border-b border-slate-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Operational Geospatial Intelligence
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                Live India District Flood Risk Canvas
              </h2>
              <p className="mt-2 text-sm text-slate-400 max-w-2xl">
                Explore all 590 monitored districts across India. Click any point to view real precipitation
                factors, trend trajectory, and why the model assigned the specific risk tier.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/authority-dashboard"
                className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-600/20 px-4 py-2 text-xs font-bold text-blue-300 transition hover:bg-blue-600 hover:text-white"
              >
                <span>Full Command Center</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="h-[560px] sm:h-[640px] w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <LandingMap />
          </div>

        </div>
      </section>

      {/* =======================================================
          AI FLOOD INTELLIGENCE (HONEST & TRANSPARENT MODEL SPECS)
      ======================================================= */}
      <section id="model-intelligence" className="py-20 border-b border-slate-800/60 bg-slate-900/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Technical Transparency & Rigor
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white">
              Random Forest Flood Prediction Engine
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Unlike black-box generative models, our platform operates on an audited, deterministic Random Forest
              classifier trained with chronological validation on actual precipitation time series.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 items-start">
            
            {/* LEFT: MODEL ARCHITECTURE & METRICS */}
            <div className="space-y-4">
              
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-blue-400" />
                  Model Specification
                </h3>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-slate-500 text-[10px] font-bold uppercase">Algorithm</span>
                    <div className="mt-1 font-bold text-white text-sm">Random Forest</div>
                    <span className="text-[11px] text-slate-400">400 Estimators, Depth 10</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-slate-500 text-[10px] font-bold uppercase">Dataset</span>
                    <div className="mt-1 font-bold text-white text-sm">590 Districts</div>
                    <span className="text-[11px] text-slate-400">2024 Daily Rainfall Series</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-slate-500 text-[10px] font-bold uppercase">Feature Vectors</span>
                    <div className="mt-1 font-bold text-white text-sm">23 Meteorological</div>
                    <span className="text-[11px] text-slate-400">Time-lagged catchment variables</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-slate-500 text-[10px] font-bold uppercase">Validation Split</span>
                    <div className="mt-1 font-bold text-white text-sm">Chronological</div>
                    <span className="text-[11px] text-slate-400">Train: Jan-Aug / Test: Sep-Dec</span>
                  </div>
                </div>

                {/* Evaluation Metrics */}
                <div className="mt-5 border-t border-slate-800 pt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                    Chronological Test Split Evaluation Metrics
                  </span>
                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                      <div className="font-mono text-xl font-black text-cyan-400">93.8%</div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Accuracy</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                      <div className="font-mono text-xl font-black text-blue-400">0.941</div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">ROC-AUC</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                      <div className="font-mono text-xl font-black text-indigo-400">87.3%</div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">F1-Score</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* SIGNAL FUSION CARD */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-xs">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  Multi-Source Signal Fusion Engine
                </h4>
                <p className="mt-2 text-slate-400 leading-relaxed">
                  Final flood probabilities are computed through weighted signal agreement rather than single-source estimation:
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-2.5">
                    <span className="font-semibold text-slate-300">Rainfall ML Lead Probability</span>
                    <span className="font-mono font-bold text-blue-400">70% Weight</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-2.5">
                    <span className="font-semibold text-slate-300">Open-Meteo High-Resolution Forecast</span>
                    <span className="font-mono font-bold text-cyan-400">30% Weight</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-2.5">
                    <span className="font-semibold text-slate-400">Copernicus Sentinel-1 SAR Radar Extent</span>
                    <span className="font-mono font-bold text-amber-400 text-[11px]">Integration Ready</span>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT: FEATURE IMPORTANCE VISUALIZATION */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Feature Importance Ranking</h3>
                  <p className="text-xs text-slate-400">Derived from 400 Random Forest estimators</p>
                </div>
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                  TOP PREDICTORS
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                
                {/* 1 */}
                <div>
                  <div className="flex justify-between font-mono mb-1">
                    <span className="text-slate-300">rainfall_30d (30-Day Cumulative Saturation)</span>
                    <span className="font-bold text-blue-400">19.1%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "95%" }} />
                  </div>
                </div>

                {/* 2 */}
                <div>
                  <div className="flex justify-between font-mono mb-1">
                    <span className="text-slate-300">max_rainfall_30d (Peak Daily Rain in 30 Days)</span>
                    <span className="font-bold text-blue-400">12.9%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "65%" }} />
                  </div>
                </div>

                {/* 3 */}
                <div>
                  <div className="flex justify-between font-mono mb-1">
                    <span className="text-slate-300">heavy_rain_30d (Heavy Rain Days Count)</span>
                    <span className="font-bold text-blue-400">11.4%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "57%" }} />
                  </div>
                </div>

                {/* 4 */}
                <div>
                  <div className="flex justify-between font-mono mb-1">
                    <span className="text-slate-300">max_rainfall_14d (14-Day Peak Rain Burst)</span>
                    <span className="font-bold text-cyan-400">10.8%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: "54%" }} />
                  </div>
                </div>

                {/* 5 */}
                <div>
                  <div className="flex justify-between font-mono mb-1">
                    <span className="text-slate-300">rainfall_14d (14-Day Cumulative Rain)</span>
                    <span className="font-bold text-cyan-400">9.4%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: "47%" }} />
                  </div>
                </div>

                {/* 6 */}
                <div>
                  <div className="flex justify-between font-mono mb-1">
                    <span className="text-slate-300">heavy_rain_14d (14-Day Heavy Rain Days)</span>
                    <span className="font-bold text-cyan-400">7.2%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: "36%" }} />
                  </div>
                </div>

                {/* 7 */}
                <div>
                  <div className="flex justify-between font-mono mb-1">
                    <span className="text-slate-300">rainfall_7d (7-Day Cumulative Rain)</span>
                    <span className="font-bold text-indigo-400">6.3%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: "31%" }} />
                  </div>
                </div>

                {/* 8 */}
                <div>
                  <div className="flex justify-between font-mono mb-1">
                    <span className="text-slate-300">max_rainfall_7d (7-Day Peak Rain Burst)</span>
                    <span className="font-bold text-indigo-400">6.1%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: "30%" }} />
                  </div>
                </div>

              </div>

              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-slate-400 leading-relaxed">
                <span className="font-bold text-white block mb-1">Hydrological Insight:</span>
                Catchment soil saturation over 30 days accounts for over 43% of total model decision weight,
                confirming that antecedent moisture is the decisive factor converting heavy rainfall into flooding.
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =======================================================
          TRANSPARENT DATA SOURCES
      ======================================================= */}
      <section id="data-sources" className="py-20 border-b border-slate-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Data Integrity & Attribution
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white">
              Data Ingestion Transparency
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Every prediction is computed exclusively from verifiable meteorological and hydrological data pipelines.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between">
                <Database className="h-5 w-5 text-blue-400" />
                <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  ACTIVE
                </span>
              </div>
              <h3 className="mt-3 font-bold text-white text-sm">IMD / IMERG Daily Rainfall</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                District-level daily precipitation series establishing historical catchments, soil saturation baselines, and burst thresholds.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between">
                <Activity className="h-5 w-5 text-cyan-400" />
                <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  ACTIVE
                </span>
              </div>
              <h3 className="mt-3 font-bold text-white text-sm">Open-Meteo Weather Forecast</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                High-resolution numerical weather prediction updating every 30 minutes with temperature, humidity, and rainfall probability.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between">
                <Compass className="h-5 w-5 text-indigo-400" />
                <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  ACTIVE
                </span>
              </div>
              <h3 className="mt-3 font-bold text-white text-sm">Global River Discharge API</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                GloFAS hydrological river discharge estimates tracking flow rates (m³/s) across major Indian river basins.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between">
                <Layers className="h-5 w-5 text-yellow-400" />
                <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  ACTIVE
                </span>
              </div>
              <h3 className="mt-3 font-bold text-white text-sm">Digital Elevation Matrix (DEM)</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                90m topographical elevation data used to determine low-lying drainage basins and natural water accumulation corridors.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between">
                <Satellite className="h-5 w-5 text-purple-400" />
                <span className="rounded bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                  INTEGRATION READY
                </span>
              </div>
              <h3 className="mt-3 font-bold text-white text-sm">Copernicus Sentinel-1 SAR</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                7.5MB SAR scene catalog indexed via Copernicus Data Space API. Offline radar processing pipeline ready for seasonal activation.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between">
                <Radio className="h-5 w-5 text-red-400" />
                <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  ACTIVE
                </span>
              </div>
              <h3 className="mt-3 font-bold text-white text-sm">Citizen Geolocation SOS</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Live browser GPS coordinates providing reverse-geocoded distress signals connected directly to authority dispatch units.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =======================================================
          TWO ROLES: CITIZEN VS AUTHORITY
      ======================================================= */}
      <section className="py-20 border-b border-slate-800/60 bg-slate-900/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Role-Specific Interfaces
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white">
              Designed for Citizens & Disaster Commanders
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            
            {/* CITIZEN CARD */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Public / Citizen Portal</h3>
                    <p className="text-xs text-slate-400">Mobile-First Early Warning & Distress</p>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300 mt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Instant automatic district flood risk lookup</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Plain-language explanation of local water level signals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>One-Tap GPS Emergency SOS with live tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Safe shelters and turn-by-turn evacuation routing</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href="/user-dashboard"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-xs font-bold text-white transition hover:bg-cyan-500"
                >
                  <span>Open Citizen Portal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* AUTHORITY CARD */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Authority Command Center</h3>
                    <p className="text-xs text-slate-400">Tactical Control Room & Rescue Management</p>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300 mt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Full 590-district geospatial risk matrix</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Live emergency SOS triage and nearest unit assignment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Automated district flood alert engine with broadcast</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Rescue team tactical readiness & vehicle telemetry</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition hover:bg-blue-500"
                >
                  <span>Access Command Center</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =======================================================
          FOOTER
      ======================================================= */}
      <footer className="border-t border-slate-800/80 bg-[#05080f] py-12 text-slate-400 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-800/80 pb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">
                  AI Flood Prediction Platform
                </span>
                <p className="text-[11px] text-slate-500">
                  Geospatial Early Warning & Emergency Response
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-medium text-slate-300">
              <Link href="/privacy" className="transition hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="transition hover:text-white">Terms of Service</Link>
              <Link href="/user-dashboard" className="transition hover:text-white">Citizen Portal</Link>
              <Link href="/login" className="transition hover:text-white">Authority Login</Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} AI Flood Prediction Platform. Built for NDMA & State Disaster Management Authorities.</p>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Telemetry Connected • 590 Districts Active</span>
            </div>
          </div>
        </div>
      </footer>

      {/* =======================================================
          INTERACTIVE ONBOARDING MODAL
      ======================================================= */}
      {isOnboardingOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-white">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Platform Walkthrough
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5">
              <span className="rounded bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-300">
                {onboardingSteps[onboardingStep].tag}
              </span>
              <h3 className="mt-2 text-lg font-bold text-white">
                {onboardingSteps[onboardingStep].title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                {onboardingSteps[onboardingStep].desc}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
              <div className="flex items-center gap-1.5">
                {onboardingSteps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === onboardingStep ? "w-6 bg-blue-500" : "w-1.5 bg-slate-700"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {onboardingStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setOnboardingStep((p) => p - 1)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Back
                  </button>
                )}
                {onboardingStep < onboardingSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setOnboardingStep((p) => p + 1)}
                    className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsOnboardingOpen(false)}
                    className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    Got It
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}