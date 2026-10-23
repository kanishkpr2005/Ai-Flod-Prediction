"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, Lock, Database, Eye, Bell, ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
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
            <Lock className="h-4 w-4" />
            <span>Official Policy Documentation</span>
          </div>
          <h1 className="text-3xl font-black text-white sm:text-4xl">Privacy & Telemetry Policy</h1>
          <p className="mt-2 text-xs text-slate-400">
            Effective Date: Current Release • Designed according to National Disaster Management Guidelines
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              1. Purpose of Data Processing
            </h2>
            <p>
              The <strong>AI Flood Prediction Platform</strong> operates as an emergency intelligence and flood early-warning
              platform. Processing of personal, geospatial, and meteorological data is performed strictly to protect human life,
              facilitate rapid evacuation, issue timely alerts, and dispatch emergency rescue teams (NDRF/SDRF/local disaster managers).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">2. Categories of Information Collected</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 text-xs sm:text-sm">
              <li>
                <strong>Geographical & GPS Telemetry:</strong> When citizens trigger the One-Tap Emergency SOS or request local risk checks, browser GPS latitude and longitude coordinates are processed to identify district vulnerability and dispatch the nearest response unit.
              </li>
              <li>
                <strong>Contact & Distress Information:</strong> Name, optional phone number, headcount, and situation details entered in the SOS report form are securely stored to guide search and rescue operations.
              </li>
              <li>
                <strong>Authority Account Credentials:</strong> Authority and operator emails and salted password hashes for identity verification and role-based access control.
              </li>
              <li>
                <strong>Public Meteorological Series:</strong> Aggregated, non-personal rainfall data from India Meteorological Department (IMD) / NASA IMERG and numerical forecasts from Open-Meteo.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">3. Row-Level Data Security & Access Control</h2>
            <p className="text-xs sm:text-sm">
              Citizen distress messages and location signals are accessible exclusively to authorized disaster control room
              operators and emergency rescue units. Data in transit is secured using modern TLS encryption, and database access
              is restricted to authenticated operational sessions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">4. Right to Deletion & Account Erasure</h2>
            <p className="text-xs sm:text-sm">
              In compliance with data protection standards, users maintain the right to permanently erase their account
              and associated profile records at any time. A self-service <strong>Delete Account</strong> option is provided
              within user settings, which immediately purges user credentials and personal notification queues.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">5. Third-Party Meteorological Services</h2>
            <p className="text-xs sm:text-sm">
              The platform queries Open-Meteo for live weather, river discharge, and elevation without transmitting citizen
              identities. Copernicus Sentinel-1 catalog queries are performed on a server-to-server basis for district-wide
              hydrological analysis.
            </p>
          </section>

        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 text-xs text-slate-500 flex justify-between">
          <span>AI Flood Prediction Platform</span>
          <span>Inquiries: disaster-control@platform.local</span>
        </div>
      </div>
    </main>
  );
}
