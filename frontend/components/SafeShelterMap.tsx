"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/config";

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface Shelter {
  id: number;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  capacity: number;
  available: number;
  type: string;
  contact: string;
}

interface SafeSheltersProps {
  userLocation: UserLocation | null;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

export default function SafeShelters({
  userLocation,
}: SafeSheltersProps) {
  const [showAll, setShowAll] = useState(false);
  const [shelterData, setShelterData] = useState<Shelter[]>([]);

  useEffect(() => {
    let active = true;

    fetch(`${API_BASE_URL}/shelters`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Shelters request failed");
        return response.json();
      })
      .then((result) => {
        if (active) {
          setShelterData(result.shelters || []);
        }
      })
      .catch(() => {
        if (active) setShelterData([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const sortedShelters = useMemo(() => {
    const currentLocation = userLocation;

    if (!currentLocation) {
      return shelterData;
    }

    const locationLatitude = currentLocation.latitude;
    const locationLongitude = currentLocation.longitude;

    return shelterData
      .map((shelter) => ({
        ...shelter,
        distance: calculateDistance(
          locationLatitude,
          locationLongitude,
          shelter.latitude,
          shelter.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [shelterData, userLocation]);

  const visibleShelters = showAll
    ? sortedShelters
    : sortedShelters.slice(0, 4);

  return (
    <section className="rounded-3xl border border-green-500/20 bg-slate-900">

      {/* HEADER */}
      <div className="border-b border-slate-800 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-2xl">
                🏠
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Safe Shelters
                </h2>

                <p className="text-sm text-slate-400">
                  Emergency shelters and relief centres
                </p>
              </div>
            </div>
          </div>

          {!userLocation && (
            <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
              📍 Detect location for nearest shelter
            </span>
          )}

        </div>
      </div>

      {/* SHELTER LIST */}
      <div className="divide-y divide-slate-800">

        {visibleShelters.map((shelter) => {
          const distance =
            "distance" in shelter
              ? shelter.distance
              : null;

          const availability =
            (shelter.available /
              shelter.capacity) *
            100;

          return (
            <div
              key={shelter.id}
              className="p-6 transition hover:bg-slate-800/40"
            >

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                {/* INFO */}
                <div className="flex gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-2xl">
                    🏠
                  </div>

                  <div>

                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">
                        {shelter.name}
                      </h3>

                      <span className="rounded-full bg-green-500/10 px-2 py-1 text-[10px] font-bold text-green-400">
                        SAFE
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-400">
                      📍 {shelter.city}, {shelter.state}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {shelter.type}
                    </p>

                    {distance !== null && (
                      <p className="mt-2 text-sm font-semibold text-blue-400">
                        📏 {typeof distance === "number" && Number.isFinite(distance)
                         ? `${distance.toFixed(1)} km away`
                            : "Distance unavailable"}
                      </p>
                    )}
                  </div>
                </div>

                {/* CAPACITY */}
                <div className="min-w-[220px]">

                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-slate-400">
                      Available Capacity
                    </span>

                    <span className="font-semibold text-green-400">
                      {shelter.available}/
                      {shelter.capacity}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{
                        width: `${Math.min(
                          100,
                          availability
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    📞 {shelter.contact}
                  </p>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${shelter.latitude},${shelter.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block rounded-xl bg-green-600 px-4 py-2 text-center text-xs font-bold text-white hover:bg-green-500"
                  >
                    🧭 Get Directions
                  </a>
                </div>

              </div>
            </div>
          );
        })}

      </div>

      {/* SHOW MORE */}
      {sortedShelters.length > 4 && (
        <div className="border-t border-slate-800 p-4 text-center">

          <button
            onClick={() => setShowAll(!showAll)}
            className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
          >
            {showAll
              ? "Show Less"
              : `Show All ${sortedShelters.length} Shelters`}
          </button>

        </div>
      )}

    </section>
  );
}