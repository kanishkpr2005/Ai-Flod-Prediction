"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { API_BASE_URL } from "@/lib/config";

const DisasterMap = dynamic(
  () => import("@/components/DisasterMap"),
  { ssr: false }
);

const API = API_BASE_URL;

type Alert = {
  id: number;
  title: string;
  message: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  severity: string;
  status: string;
  disaster_type?: string;
  created_at?: string;
  expires_at?: string | null;
};

type DistrictRisk = {
  id: string;
  type: "district-risk";
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  severity: string;
  probability: number;
  rainfall_probability: number;
  weather_probability: number;
};

type Environment = {
  temperature_c?: number;
  current_precipitation_mm?: number;
  current_rain_mm?: number;
  wind_speed_kmh?: number;
  rainfall_forecast_mm?: number[];
  river_discharge_m3s?: number[];
  elevation_m?: number;
  updated_at?: string;
};

type SOS = {
  id: number;
  name: string;
  phone?: string | null;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  emergency?: string | null;
  description?: string | null;
  people: number;
  priority: string;
  status: string;
  assigned_unit_id?: number | null;
  assigned_team_id?: number | null;
  created_at?: string;
  resolved_at?: string | null;
};

type Unit = {
  id: number;
  name: string;
  unit_type: string;
  contact?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  vehicle_number?: string | null;
};

type Team = {
  id: number;
  name: string;
  team_type: string;
  contact?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  members: number;
  status: string;
  specialization?: string | null;
};

type Shelter = {
  id: number;
  name: string;
  city: string;
  state: string;
  available: number;
  capacity: number;
  type: string;
};

type Notification = {
  id: number;
  title: string;
  message: string;
  area: string;
  severity: string;
  created_at?: string;
};

export default function AuthorityDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [districtRisks, setDistrictRisks] = useState<DistrictRisk[]>([]);
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [sos, setSos] = useState<SOS[]>([]);
  const [handledSos, setHandledSos] = useState<SOS[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [loading, setLoading] = useState(true);
  const [selectedSOS, setSelectedSOS] = useState<SOS | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  async function fetchJSON(url: string) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!res.ok) return null;

      return await res.json();
    } catch {
      return null;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  const loadDashboard = useCallback(async () => {
    try {
      const [alertData, sosData, handledSosData, gisData, unitData, teamData, shelterData, notificationData] =
        await Promise.all([
          fetchJSON(`${API}/alerts`),
          fetchJSON(`${API}/sos`),
          fetchJSON(`${API}/sos/handled`),
          fetchJSON(`${API}/gis/district-alerts`),
          fetchJSON(`${API}/response-units`),
          fetchJSON(`${API}/response-teams`),
          fetchJSON(`${API}/shelters`),
          fetchJSON(`${API}/notifications?role=authority`),
        ]);

      if (notificationData) {
        setNotifications(notificationData.notifications || []);
      }

      if (alertData) {
        setAlerts(
          alertData.alerts ||
            alertData.active_alerts ||
            alertData.data ||
            []
        );
      }

      if (sosData) {
        setSos(
          sosData.sos_requests ||
            sosData.sos ||
            sosData.data ||
            []
        );
      }

      if (handledSosData) {
        setHandledSos(
          handledSosData.sos_requests ||
            handledSosData.sos ||
            handledSosData.data ||
            []
        );
      }

      if (gisData) {
        setDistrictRisks(gisData.district_predictions || []);
        const firstDistrict = gisData.district_predictions?.[0];
        if (firstDistrict) {
          const environmentData = await fetchJSON(
            `${API}/gis/environment?latitude=${firstDistrict.latitude}&longitude=${firstDistrict.longitude}`
          );
          if (environmentData) setEnvironment(environmentData);
        }
      }

      if (unitData) {
        setUnits(
          unitData.response_units ||
            unitData.units ||
            unitData.data ||
            []
        );
      }

      if (teamData) {
        setTeams(
          teamData.response_teams ||
            teamData.teams ||
            teamData.data ||
            []
        );
      }

      if (shelterData) {
        setShelters(shelterData.shelters || shelterData.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(
      loadDashboard,
      30000
    );

    return () => clearInterval(interval);
  }, [loadDashboard]);

  const activeAlerts = useMemo(
    () =>
      alerts.filter(
        (a) =>
          !a.status ||
          a.status.toUpperCase() === "ACTIVE"
      ),
    [alerts]
  );

  const activeSOS = useMemo(
    () =>
      sos.filter((s) =>
        [
          "PENDING",
          "ASSIGNED",
          "IN_PROGRESS",
        ].includes(s.status?.toUpperCase())
      ),
    [sos]
  );

  const criticalSOS = useMemo(
    () =>
      activeSOS.filter(
        (s) =>
          s.priority?.toUpperCase() === "CRITICAL"
      ),
    [activeSOS]
  );

  const resolvedSOS = useMemo(
    () =>
      handledSos.filter((s) =>
        ["RESOLVED", "CANCELLED"].includes(s.status?.toUpperCase())
      ),
    [handledSos]
  );

  const availableUnits = useMemo(
    () =>
      units.filter(
        (u) =>
          u.status?.toUpperCase() === "AVAILABLE"
      ),
    [units]
  );

  const availableTeams = useMemo(
    () =>
      teams.filter(
        (t) =>
          t.status?.toUpperCase() === "AVAILABLE"
      ),
    [teams]
  );

  const mapAlerts = activeAlerts
    .filter(
      (a) =>
        a.latitude != null &&
        a.longitude != null
    )
    .map((a) => ({
      id: a.id,
      latitude: a.latitude!,
      longitude: a.longitude!,
      type: "alert",
      severity: a.severity,
      title: a.title,
      location: a.location,
      message: a.message,
      disaster_type: a.disaster_type,
    }));

  const mapSOS = activeSOS
    .filter(
      (s) =>
        s.latitude != null &&
        s.longitude != null
    )
    .map((s) => ({
      id: s.id,
      latitude: s.latitude!,
      longitude: s.longitude!,
      type: "sos",
      severity: s.priority,
      title: `SOS #${s.id}`,
      location: s.location,
      message:
        s.description ||
        s.emergency ||
        "Emergency SOS",
      people: s.people,
      status: s.status,
      name: s.name,
    }));

  const mapUnits = units
    .filter(
      (u) =>
        u.latitude != null &&
        u.longitude != null
    )
    .map((u) => ({
      id: u.id,
      latitude: u.latitude!,
      longitude: u.longitude!,
      type: "unit",
      title: u.name,
      location: u.location ?? undefined,
      severity: u.status,
      unit_type: u.unit_type,
      status: u.status,
    }));

  const mapTeams = teams
    .filter(
      (t) =>
        t.latitude != null &&
        t.longitude != null
    )
    .map((t) => ({
      id: t.id,
      latitude: t.latitude!,
      longitude: t.longitude!,
      type: "team",
      title: t.name,
      location: t.location ?? undefined,
      severity: t.status,
      team_type: t.team_type,
      status: t.status,
      members: t.members,
    }));

  const mapData = [
    ...mapAlerts,
    ...mapSOS,
    ...mapUnits,
    ...mapTeams,
  ];

  const mapDistrictRisks = districtRisks.map((risk) => ({
    ...risk,
    title: risk.district,
    location: `${risk.district}, ${risk.state}`,
  }));

  const assignedSOS = activeSOS.filter(
    (item) => item.assigned_unit_id || item.assigned_team_id
  ).length;

  async function updateSOSStatus(
    id: number,
    status: string
  ) {
    try {
      await fetch(
        `${API}/sos/${id}/status?status=${status}`,
        {
          method: "PATCH",
        }
      );

      await loadDashboard();
      setSelectedSOS(null);
    } catch {
      alert("Unable to update SOS");
    }
  }

  function severityClass(
    severity?: string
  ) {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-600";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500 text-black";
      case "LOW":
        return "bg-green-600";
      default:
        return "bg-slate-600";
    }
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {/* HEADER */}

      <header className="border-b border-slate-700 bg-[#0a1626] px-6 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 text-xl">
                🚨
              </div>

              <div>
                <h1 className="text-xl font-bold">
                  Authority Command Center
                </h1>

                <p className="text-xs text-slate-400">
                  Rakshak Ai • Monitoring & Emergency Response
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            SYSTEM ONLINE
            <span className="ml-2 text-slate-500">
              Auto refresh: 30s
            </span>
          </div>
        </div>
      </header>

      {notifications.length > 0 && (
        <section className="border-b border-red-500/20 bg-red-950/20 px-4 py-3">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-bold uppercase tracking-wider text-red-300">
              Flood notifications for authority
            </p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {notifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                  <p className="text-sm font-semibold text-red-200">{notification.title}</p>
                  <p className="mt-1 text-xs text-red-100/80">{notification.message}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* STATS */}

      <section className="grid grid-cols-2 gap-3 p-4 md:grid-cols-5">
        <StatCard
          title="Active SOS"
          value={activeSOS.length}
          icon="🆘"
          danger
        />

        <StatCard
          title="Critical SOS"
          value={criticalSOS.length}
          icon="🔴"
        />

        <StatCard
          title="Handled SOS"
          value={resolvedSOS.length}
          icon="✅"
        />

        <StatCard
          title="Active Alerts"
          value={activeAlerts.length}
          icon="⚠️"
        />

        <StatCard
          title="Available Units"
          value={availableUnits.length}
          icon="🚑"
        />

        <StatCard
          title="Available Teams"
          value={availableTeams.length}
          icon="🚒"
        />
      </section>

      {/* MAIN MAP */}

      <section className="grid gap-4 px-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-[#0b1728] shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <div>
              <h2 className="font-semibold">
                🗺️ Live Disaster Operations Map
              </h2>

              <p className="text-xs text-slate-400">
                Live alerts, SOS requests and response resources
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[10px]">
              <Legend color="bg-red-500" text="SOS" />
              <Legend color="bg-orange-500" text="Alert" />
              <Legend color="bg-blue-500" text="Team" />
              <Legend color="bg-green-500" text="Unit" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border-b border-slate-700 bg-slate-700 sm:grid-cols-4">
            <MapMetric label="Mapped records" value={mapData.length} />
            <MapMetric label="Mapped SOS" value={mapSOS.length} />
            <MapMetric label="Mapped alerts" value={mapAlerts.length} />
            <MapMetric label="Assigned SOS" value={assignedSOS} />
            <MapMetric label="District risks" value={districtRisks.length} />
          </div>

          <div className="h-[420px] w-full lg:h-[540px]">
            <DisasterMap
              disasters={mapAlerts}
              sosRequests={mapSOS}
              responseUnits={mapUnits}
              responseTeams={mapTeams}
              districtAlerts={mapDistrictRisks}
              selectedSOS={
                selectedSOS && selectedSOS.latitude != null && selectedSOS.longitude != null
                  ? {
                      id: selectedSOS.id,
                      latitude: selectedSOS.latitude,
                      longitude: selectedSOS.longitude,
                      type: "sos",
                      name: selectedSOS.name,
                      title: `SOS #${selectedSOS.id} - ${selectedSOS.name}`,
                      priority: selectedSOS.priority,
                      severity: selectedSOS.priority,
                      location: selectedSOS.location,
                      people: selectedSOS.people,
                      status: selectedSOS.status,
                      message: selectedSOS.description || selectedSOS.emergency || undefined,
                      assigned_unit_id: selectedSOS.assigned_unit_id,
                      assigned_team_id: selectedSOS.assigned_team_id,
                    }
                  : null
              }
              onSelectSOS={(item) => {
                const found = sos.find((s) => s.id === item.id);
                if (found) setSelectedSOS(found);
              }}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <OperationsPanel
            title="Shelter readiness"
            subtitle={`${shelters.length} safe locations reporting capacity`}
          >
            {shelters.slice(0, 4).map((shelter) => (
              <div key={shelter.id} className="border-b border-slate-800 py-3 last:border-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{shelter.name}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {shelter.city}, {shelter.state} • {shelter.type}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-green-400">
                    {shelter.available}/{shelter.capacity}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: `${Math.min(100, (shelter.available / shelter.capacity) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </OperationsPanel>

          <OperationsPanel
            title="Rescue team readiness"
            subtitle={`${availableTeams.length} available of ${teams.length} registered teams`}
          >
            {teams.slice(0, 4).map((team) => (
              <div key={team.id} className="flex items-center justify-between border-b border-slate-800 py-3 last:border-0">
                <div>
                  <p className="text-sm font-semibold">{team.name}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {team.team_type} • {team.members} members
                    {team.specialization ? ` • ${team.specialization}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${team.status === "AVAILABLE" ? "bg-green-500/15 text-green-400" : "bg-orange-500/15 text-orange-400"}`}>
                  {team.status}
                </span>
              </div>
            ))}
          </OperationsPanel>
        </div>
      </section>

      <section className="grid gap-4 px-4 pb-4 md:grid-cols-3">
        <EnvironmentCard title="Live rainfall" value={environment?.current_rain_mm != null ? `${environment.current_rain_mm} mm` : "Loading"} detail="Open-Meteo current observation" />
        <EnvironmentCard title="River discharge" value={environment?.river_discharge_m3s?.[0] != null ? `${environment.river_discharge_m3s[0]} m³/s` : "Loading"} detail="Open-Meteo flood API" />
        <EnvironmentCard title="River elevation" value={environment?.elevation_m != null ? `${environment.elevation_m} m` : "Loading"} detail="Open-Meteo elevation API" />
      </section>

      {/* CONTENT */}

      <section className="grid gap-4 p-4 lg:grid-cols-2">
        {/* SOS */}

        <div className="rounded-xl border border-slate-700 bg-[#0b1728]">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <div>
              <h2 className="font-semibold">
                🚨 Emergency SOS Requests
              </h2>
              <p className="text-xs text-slate-400">
                {activeSOS.length} active emergencies
              </p>
            </div>

            <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-400">
              LIVE
            </span>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {activeSOS.length === 0 ? (
              <Empty text="No active SOS requests" />
            ) : (
              activeSOS.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    setSelectedSOS(item)
                  }
                  className="w-full border-b border-slate-800 p-4 text-left transition hover:bg-slate-800/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          SOS #{item.id}
                        </span>

                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${severityClass(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </div>

                      <p className="mt-1 text-sm">
                        {item.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        📍 {item.location}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-500">
                        {item.emergency || "General emergency"}
                        {item.assigned_unit_id
                          ? ` • Unit #${item.assigned_unit_id}`
                          : ""}
                        {item.assigned_team_id
                          ? ` • Team #${item.assigned_team_id}`
                          : ""}
                      </p>
                    </div>

                    <div className="text-right text-xs">
                      <div className="text-slate-300">
                        👥 {item.people}
                      </div>

                      <div className="mt-1 text-slate-500">
                        {item.status}
                      </div>

                      <div className="mt-1 text-[10px] text-slate-600">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Time unavailable"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-400">
                    {item.emergency ||
                      "General emergency"}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-[#0b1728]">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <div>
              <h2 className="font-semibold">
                ✅ Handled SOS Archive
              </h2>
              <p className="text-xs text-slate-400">
                Resolved and cancelled incidents retained in the database
              </p>
            </div>

            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
              {resolvedSOS.length} HANDLED
            </span>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {resolvedSOS.length === 0 ? (
              <Empty text="No handled SOS requests yet" />
            ) : (
              resolvedSOS.slice(0, 20).map((item) => (
                <div
                  key={item.id}
                  className="border-b border-slate-800 p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          SOS #{item.id}
                        </span>

                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${severityClass(
                            item.priority
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm">
                        {item.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        📍 {item.location}
                      </p>
                    </div>

                    <div className="text-right text-[10px] text-slate-500">
                      {item.resolved_at
                        ? new Date(item.resolved_at).toLocaleString([], {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "Handled"}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-400">
                    {item.emergency || "General emergency"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ALERTS */}

        <div className="rounded-xl border border-slate-700 bg-[#0b1728]">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <div>
              <h2 className="font-semibold">
                ⚠️ Active Disaster Alerts
              </h2>

              <p className="text-xs text-slate-400">
                AI & weather generated alerts
              </p>
            </div>

            <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-400">
              {activeAlerts.length} ACTIVE
            </span>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {activeAlerts.length === 0 ? (
              <Empty text="No active alerts" />
            ) : (
              activeAlerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() =>
                    setSelectedAlert(alert)
                  }
                  className="w-full border-b border-slate-800 p-4 text-left hover:bg-slate-800/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {alert.title}
                        </span>

                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${severityClass(
                            alert.severity
                          )}`}
                        >
                          {alert.severity}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        📍 {alert.location}
                      </p>
                    </div>

                    <span className="text-xs text-slate-500">
                      {alert.disaster_type ||
                        "GENERAL"}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs text-slate-300">
                    {alert.message}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      {/* RESOURCES */}

      <section className="grid gap-4 px-4 pb-6 lg:grid-cols-2">
        <ResourcePanel
          title="🚑 Response Units"
          items={units}
          type="unit"
        />

        <ResourcePanel
          title="🚒 Rescue Teams"
          items={teams}
          type="team"
        />
      </section>

      {/* SOS MODAL */}

      {selectedSOS && (
        <Modal
          title={`Emergency SOS #${selectedSOS.id}`}
          onClose={() => setSelectedSOS(null)}
        >
          <div className="space-y-3 text-sm">
            <Info label="Name" value={selectedSOS.name} />
            <Info
              label="Phone"
              value={selectedSOS.phone || "Not provided"}
            />
            <Info
              label="Location"
              value={selectedSOS.location}
            />
            <Info
              label="Emergency"
              value={
                selectedSOS.emergency ||
                "General emergency"
              }
            />
            <Info
              label="People"
              value={String(selectedSOS.people)}
            />
            <Info
              label="Priority"
              value={selectedSOS.priority}
            />
            <Info
              label="Status"
              value={selectedSOS.status}
            />

            {selectedSOS.description && (
              <div>
                <p className="text-xs text-slate-500">
                  Description
                </p>
                <p className="mt-1">
                  {selectedSOS.description}
                </p>
              </div>
            )}

            <div className="grid gap-2 pt-3 sm:grid-cols-2">
              {selectedSOS.status ===
                "PENDING" && (
                <ActionButton
                  text="Assign / Start"
                  onClick={() =>
                    updateSOSStatus(
                      selectedSOS.id,
                      "IN_PROGRESS"
                    )
                  }
                />
              )}

              {selectedSOS.status ===
                "ASSIGNED" && (
                <ActionButton
                  text="Start Response"
                  onClick={() =>
                    updateSOSStatus(
                      selectedSOS.id,
                      "IN_PROGRESS"
                    )
                  }
                />
              )}

              {selectedSOS.status ===
                "IN_PROGRESS" && (
                <ActionButton
                  text="✓ Mark Resolved"
                  onClick={() =>
                    updateSOSStatus(
                      selectedSOS.id,
                      "RESOLVED"
                    )
                  }
                />
              )}

              <button
                onClick={() =>
                  updateSOSStatus(
                    selectedSOS.id,
                    "CANCELLED"
                  )
                }
                  className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-300"
              >
                Cancel SOS
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ALERT MODAL */}

      {selectedAlert && (
        <Modal
          title={selectedAlert.title}
          onClose={() => setSelectedAlert(null)}
        >
          <div className="space-y-3 text-sm">
            <Info
              label="Location"
              value={selectedAlert.location}
            />

            <Info
              label="Severity"
              value={selectedAlert.severity}
            />

            <Info
              label="Disaster Type"
              value={
                selectedAlert.disaster_type ||
                "General"
              }
            />

            <div>
              <p className="text-xs text-slate-500">
                Alert Message
              </p>

              <p className="mt-1">
                {selectedAlert.message}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {loading && (
        <div className="fixed bottom-4 right-4 rounded-lg border border-slate-700 bg-[#0b1728] px-4 py-2 text-xs shadow-lg">
          Loading live data...
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
  danger,
}: {
  title: string;
  value: number;
  icon: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        danger
          ? "border-red-900/50 bg-red-950/20"
          : "border-slate-700 bg-[#0b1728]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>

        <span className="text-2xl font-bold">
          {value}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {title}
      </p>
    </div>
  );
}

function MapMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-[#0b1728] px-4 py-3">
      <p className="text-lg font-bold text-slate-100">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
    </div>
  );
}

function Legend({
  color,
  text,
}: {
  color: string;
  text: string;
}) {
  return (
    <span className="flex items-center gap-1">
      <span
        className={`h-2 w-2 rounded-full ${color}`}
      />
      {text}
    </span>
  );
}

function Empty({
  text,
}: {
  text: string;
}) {
  return (
    <div className="p-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-slate-200">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold hover:bg-red-700"
    >
      {text}
    </button>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-[#0b1728] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <h3 className="font-semibold">
            {title}
          </h3>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

type Resource = {
  id: number;
  name: string;
  status: string;
  unit_type?: string;
  team_type?: string;
  specialization?: string | null;
  location?: string | null;
  members?: number;
  assigned_sos_id?: number | null;
};

function ResourcePanel({
  title,
  items,
  type,
}: {
  title: string;
  items: Resource[];
  type: "unit" | "team";
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#0b1728]">
      <div className="border-b border-slate-700 px-4 py-3">
        <h2 className="font-semibold">
          {title}
        </h2>
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        {items.length === 0 ? (
          <Empty text={`No ${type}s registered`} />
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b border-slate-800 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {item.name}
                </p>

                <p className="text-xs text-slate-500">
                  {type === "unit"
                    ? item.unit_type
                    : item.team_type}
                  {item.specialization
                    ? ` • ${item.specialization}`
                    : ""}
                </p>

                <p className="mt-1 text-[11px] text-slate-600">
                  {item.location || "Location unavailable"}
                  {type === "team" && item.members
                    ? ` • ${item.members} members`
                    : ""}
                  {item.assigned_sos_id
                    ? ` • SOS #${item.assigned_sos_id}`
                    : ""}
                </p>
              </div>

              <span
                className={`rounded-full px-2 py-1 text-[10px] ${
                  item.status === "AVAILABLE"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-orange-500/20 text-orange-400"
                }`}
              >
                {item.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function OperationsPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-700 bg-[#0b1728] px-4 py-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>
        </div>
        <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.7)]" />
      </div>
      {children}
    </section>
  );
}

function EnvironmentCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#0b1728] p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}