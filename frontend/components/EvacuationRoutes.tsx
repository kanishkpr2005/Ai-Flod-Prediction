"use client";

import { useMemo, useState } from "react";

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface Route {
  id: number;
  name: string;
  from: string;
  destination: string;
  distance: number;
  estimatedTime: number;
  status: "SAFE" | "CAUTION" | "BLOCKED";
  reason: string;
  destinationLat: number;
  destinationLng: number;
}

interface EvacuationRoutesProps {
  userLocation: UserLocation | null;
}

const routes: Route[] = [
  {
    id: 1,
    name: "Primary Evacuation Route",
    from: "Current Area",
    destination: "District Relief Shelter",
    distance: 8.4,
    estimatedTime: 18,
    status: "SAFE",
    reason: "No major hazards reported on this route.",
    destinationLat: 27.1767,
    destinationLng: 78.0081,
  },
  {
    id: 2,
    name: "Secondary Evacuation Route",
    from: "Current Area",
    destination: "Government Relief Centre",
    distance: 12.7,
    estimatedTime: 27,
    status: "CAUTION",
    reason: "Moderate disaster activity reported nearby.",
    destinationLat: 27.4924,
    destinationLng: 77.6737,
  },
  {
    id: 3,
    name: "Emergency Alternate Route",
    from: "Current Area",
    destination: "Emergency Shelter",
    distance: 17.2,
    estimatedTime: 35,
    status: "SAFE",
    reason: "Alternative route recommended during emergencies.",
    destinationLat: 28.6139,
    destinationLng: 77.209,
  },
];

function getStatusClass(status: Route["status"]) {
  switch (status) {
    case "SAFE":
      return "bg-green-500/10 text-green-400 border-green-500/20";

    case "CAUTION":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

    case "BLOCKED":
      return "bg-red-500/10 text-red-400 border-red-500/20";

    default:
      return "bg-slate-800 text-slate-400 border-slate-700";
  }
}

export default function EvacuationRoutes({
  userLocation,
}: EvacuationRoutesProps) {
  const [selectedRoute, setSelectedRoute] =
    useState<number | null>(null);

  const availableRoutes = useMemo(() => {
    return routes.filter(
      (route) => route.status !== "BLOCKED"
    );
  }, []);

  return (
    <section className="rounded-3xl border border-purple-500/20 bg-slate-900">

      {/* HEADER */}
      <div className="border-b border-slate-800 p-6">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
            🛣️
          </div>

          <div>
            <h2 className="text-xl font-bold">
              Evacuation Routes
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Safer routes to nearby emergency shelters
            </p>
          </div>

        </div>

        {!userLocation && (
          <div className="mt-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-400">
            📍 Detect your location above for personalized
            evacuation guidance.
          </div>
        )}

      </div>

      {/* ROUTES */}
      <div className="divide-y divide-slate-800">

        {availableRoutes.map((route) => {

          const selected =
            selectedRoute === route.id;

          return (
            <div
              key={route.id}
              className={`p-6 transition ${
                selected
                  ? "bg-purple-500/5"
                  : "hover:bg-slate-800/40"
              }`}
            >

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                {/* ROUTE INFO */}
                <div className="flex gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl">
                    🛣️
                  </div>

                  <div>

                    <div className="flex flex-wrap items-center gap-2">

                      <h3 className="font-bold">
                        {route.name}
                      </h3>

                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] font-bold ${getStatusClass(
                          route.status
                        )}`}
                      >
                        {route.status}
                      </span>

                    </div>

                    <p className="mt-2 text-sm text-slate-300">
                      📍 {route.from}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      🏠 {route.destination}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {route.reason}
                    </p>

                  </div>

                </div>

                {/* DETAILS */}
                <div className="grid grid-cols-2 gap-3 lg:min-w-[300px]">

                  <div className="rounded-xl bg-slate-950 p-4 text-center">
                    <p className="text-xs text-slate-500">
                      Distance
                    </p>

                    <p className="mt-1 text-xl font-bold text-blue-400">
                      {route.distance} km
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950 p-4 text-center">
                    <p className="text-xs text-slate-500">
                      Estimated
                    </p>

                    <p className="mt-1 text-xl font-bold text-purple-400">
                      {route.estimatedTime} min
                    </p>
                  </div>

                </div>

              </div>

              {/* ACTIONS */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">

                <button
                  onClick={() =>
                    setSelectedRoute(
                      selected ? null : route.id
                    )
                  }
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  {selected
                    ? "Hide Route Details"
                    : "View Route Details"}
                </button>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${route.destinationLat},${route.destinationLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-center text-sm font-semibold hover:bg-purple-500"
                >
                  🧭 Open Navigation
                </a>

              </div>

              {/* SELECTED DETAILS */}
              {selected && (
                <div className="mt-5 rounded-2xl border border-purple-500/20 bg-slate-950 p-5">

                  <h4 className="font-bold text-purple-400">
                    Route Safety Information
                  </h4>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">

                    <div className="rounded-xl bg-slate-900 p-4">
                      <p className="text-xs text-slate-500">
                        Route Status
                      </p>

                      <p className="mt-1 font-bold">
                        {route.status}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-900 p-4">
                      <p className="text-xs text-slate-500">
                        Destination
                      </p>

                      <p className="mt-1 font-bold">
                        {route.destination}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-900 p-4">
                      <p className="text-xs text-slate-500">
                        Travel Time
                      </p>

                      <p className="mt-1 font-bold">
                        {route.estimatedTime} minutes
                      </p>
                    </div>

                  </div>

                  <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-300">
                    ⚠️ During an actual disaster, always follow
                    instructions from local authorities and
                    emergency responders.
                  </div>

                </div>
              )}

            </div>
          );
        })}

      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-800 p-5">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-xs text-slate-500">
            Routes shown here are currently demonstration
            routes and will be connected to live GIS routing.
          </p>

          <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
            ● Route Monitoring
          </span>

        </div>

      </div>

    </section>
  );
}