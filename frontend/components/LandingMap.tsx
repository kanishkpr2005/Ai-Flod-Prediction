"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { API_BASE_URL } from "@/lib/config";
import type { MapItem } from "./DisasterMap";

const DisasterMap = dynamic(
  () => import("@/components/DisasterMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[480px] w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-xs font-medium">Loading geospatial flood intelligence...</span>
        </div>
      </div>
    ),
  }
);

export default function LandingMap() {
  const [districts, setDistricts] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"LIVE_API" | "FALLBACK_SYNC">("LIVE_API");

  useEffect(() => {
    let isMounted = true;

    async function loadDistricts() {
      try {
        // Try live backend predictions first
        const res = await fetch(`${API_BASE_URL}/live-predictions`, {
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const json = await res.json();
          const items = json.data || [];
          if (items.length > 0 && isMounted) {
            setDistricts(
              items.map((row: any) => ({
                id: `dist-${row.state}-${row.district}`,
                type: "district-risk",
                state: row.state,
                district: row.district,
                latitude: Number(row.latitude),
                longitude: Number(row.longitude),
                severity: (row.risk_level || "LOW").toUpperCase(),
                probability: Math.round(Number(row.final_flood_probability || 0) * 100),
                rainfall_probability: Math.round(Number(row.rainfall_ml_probability || 0) * 100),
                weather_probability: Math.round(Number(row.weather_probability || 0) * 100),
                weather_data_available: Boolean(row.weather_data_available),
                rainfall_1d: row.rainfall_1d !== undefined ? Number(row.rainfall_1d) : 0,
                rainfall_3d: row.rainfall_3d !== undefined ? Number(row.rainfall_3d) : 0,
                rainfall_7d: row.rainfall_7d !== undefined ? Number(row.rainfall_7d) : 0,
                rainfall_30d: row.rainfall_30d !== undefined ? Number(row.rainfall_30d) : 0,
                rainfall_trend: row.rainfall_trend || "Stable",
                title: `${row.district} Flood Risk`,
                location: `${row.district}, ${row.state}`,
              }))
            );
            setDataSource("LIVE_API");
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Live API fetch error, falling back to local dataset:", err);
      }

      // Fallback to local snapshot containing all 590 real districts
      try {
        const localRes = await fetch("/data/districts_predictions.json");
        if (localRes.ok) {
          const items = await localRes.json();
          if (isMounted) {
            setDistricts(
              items.map((row: any) => ({
                id: `dist-${row.state}-${row.district}`,
                type: "district-risk",
                state: row.state,
                district: row.district,
                latitude: Number(row.latitude),
                longitude: Number(row.longitude),
                severity: (row.risk_level || "LOW").toUpperCase(),
                probability: Math.round(Number(row.final_flood_probability || 0) * 100),
                rainfall_probability: Math.round(Number(row.rainfall_ml_probability || 0) * 100),
                weather_probability: Math.round(Number(row.weather_probability || 0) * 100),
                weather_data_available: Boolean(row.weather_data_available),
                rainfall_1d: row.rainfall_1d !== undefined ? Number(row.rainfall_1d) : 0,
                rainfall_3d: row.rainfall_3d !== undefined ? Number(row.rainfall_3d) : 0,
                rainfall_7d: row.rainfall_7d !== undefined ? Number(row.rainfall_7d) : 0,
                rainfall_30d: row.rainfall_30d !== undefined ? Number(row.rainfall_30d) : 0,
                rainfall_trend: row.rainfall_trend || "Stable",
                title: `${row.district} Flood Risk`,
                location: `${row.district}, ${row.state}`,
              }))
            );
            setDataSource("FALLBACK_SYNC");
          }
        }
      } catch (e) {
        console.error("Local prediction file fallback failed:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDistricts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <DisasterMap
        districtAlerts={districts}
        heightClass="h-full min-h-[460px] md:min-h-[580px]"
      />
    </div>
  );
}
