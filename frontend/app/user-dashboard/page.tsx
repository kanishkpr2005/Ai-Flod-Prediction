"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { API_BASE_URL } from "@/lib/config";

const DisasterMap = dynamic(
  () => import("@/components/DisasterMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-400">
        Loading disaster map...
      </div>
    ),
  }
);

const SafeShelters = dynamic(
  () => import("@/components/SafeShelterMap"),
  { ssr: false }
);

const API_URL = API_BASE_URL;

/* ============================================================
   TYPES
============================================================ */

interface Alert {
  id: number;
  title: string;
  message: string;
  location: string;
  severity: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  disaster_type: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface SOSRequest {
  id: number;
  name: string;
  phone?: string | null;
  location: string;
  people: number;
  emergency: string;
  priority: string;
  latitude: number | null;
  longitude: number | null;
  description?: string | null;
  status: string;
  created_at?: string | null;
}

interface DashboardData {
  total_sos: number;
  critical_sos: number;
  total_alerts: number;
  total_volunteers: number;
  available_volunteers: number;
  total_rescue_teams: number;
  available_rescue_teams: number;
  deployed_rescue_teams: number;
  total_rescue_members: number;
  deployed_volunteers: number;
  message: string;
}

interface Disaster {
  id: number;
  disaster_type: string;
  location: string;
  severity: string;
  latitude: number;
  longitude: number;
  description: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  area: string;
  severity: string;
  created_at?: string;
}

type MapFilter =
  | "All"
  | "HIGH"
  | "MEDIUM"
  | "LOW";

/* ============================================================
   HELPERS
============================================================ */

function getSeverityClass(severity: string) {
  const value = severity?.toLowerCase();

  if (value === "critical") {
    return "border-red-500/40 bg-red-500/10 text-red-400";
  }

  if (value === "high") {
    return "border-orange-500/40 bg-orange-500/10 text-orange-400";
  }

  if (
    value === "medium" ||
    value === "moderate"
  ) {
    return "border-yellow-500/40 bg-yellow-500/10 text-yellow-400";
  }

  return "border-green-500/40 bg-green-500/10 text-green-400";
}

function getStatusClass(status: string) {
  const value = status?.toUpperCase();

  if (value === "RESOLVED") {
    return "bg-green-500/10 text-green-400 border-green-500/30";
  }

  if (value === "CANCELLED") {
    return "bg-slate-500/10 text-slate-400 border-slate-500/30";
  }

  if (value === "IN_PROGRESS") {
    return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  }

  if (value === "ASSIGNED") {
    return "bg-purple-500/10 text-purple-400 border-purple-500/30";
  }

  return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
}

function formatDate(dateString?: string | null) {
  if (!dateString) {
    return "Unknown";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* ============================================================
   GOOGLE MAPS EVACUATION ROUTE
============================================================ */

function openGoogleMapsRoute(
  destination: string,
  latitude?: number | null,
  longitude?: number | null
) {
  if (typeof window === "undefined") {
    return;
  }

  let url = "";

  /*
   * If GPS coordinates are available:
   * Google Maps will use current coordinates
   * as the starting point.
   */
  if (
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined
  ) {
    const origin = `${latitude},${longitude}`;

    url =
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(destination)}` +
      `&travelmode=driving`;
  } else {
    /*
     * Without GPS, Google Maps itself decides
     * the starting location.
     */
    url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${encodeURIComponent(destination)}` +
      `&travelmode=driving`;
  }

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}

/* ============================================================
   USER DASHBOARD
============================================================ */

export default function UserDashboard() {
  /* ----------------------------------------------------------
     STATE
  ---------------------------------------------------------- */

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [alerts, setAlerts] =
    useState<Alert[]>([]);

  const [sosRequests, setSosRequests] =
    useState<SOSRequest[]>([]);

  const [disasters, setDisasters] =
    useState<Disaster[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [alertsLoading, setAlertsLoading] =
    useState(true);

  const [sosLoading, setSosLoading] =
    useState(true);

  const [mapLoading, setMapLoading] =
    useState(true);

  const [mapError, setMapError] =
    useState("");

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [error, setError] =
    useState("");

  const [sosError, setSosError] =
    useState("");

  const [sosSending, setSosSending] =
    useState(false);

  const [sosMessage, setSosMessage] =
    useState("");

  const [alertsOpen, setAlertsOpen] =
    useState(true);

  const [mySosOpen, setMySosOpen] =
    useState(true);

  const [mapFilter, setMapFilter] =
    useState<MapFilter>("All");

  /* ----------------------------------------------------------
     EVACUATION ROUTE STATE
  ---------------------------------------------------------- */

  const [evacuationOpen, setEvacuationOpen] =
    useState(true);

  const [evacuationDestination, setEvacuationDestination] =
    useState("");

  const [evacuationSending, setEvacuationSending] =
    useState(false);

  const [evacuationMessage, setEvacuationMessage] =
    useState("");

  const [userLatitude, setUserLatitude] =
    useState<number | null>(null);

  const [userLongitude, setUserLongitude] =
    useState<number | null>(null);

  /* ----------------------------------------------------------
     DETAILED SOS FORM
  ---------------------------------------------------------- */

  const [showDetailedSOS, setShowDetailedSOS] =
    useState(false);

  const [formName, setFormName] =
    useState("");

  const [formPhone, setFormPhone] =
    useState("");

  const [formLocation, setFormLocation] =
    useState("");

  const [formPeople, setFormPeople] =
    useState(1);

  const [formEmergency, setFormEmergency] =
    useState("");

  const [formDescription, setFormDescription] =
    useState("");

  const [formPriority, setFormPriority] =
    useState("HIGH");

  const [formSending, setFormSending] =
    useState(false);

  const [formMessage, setFormMessage] =
    useState("");

  /* ============================================================
     FETCH DASHBOARD
  ============================================================ */

  const fetchDashboard = useCallback(
    async () => {
      try {
        setError("");

        const response = await fetch(
          `${API_URL}/dashboard`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Dashboard request failed"
          );
        }

        const result =
          await response.json();

        const overview = result.overview || {};
        const rescue = result.rescue || {};
        const volunteerData = result.volunteers || {};

        setDashboard({
          ...result,
          total_sos: overview.total_sos ?? result.total_sos ?? 0,
          critical_sos: result.sos?.critical ?? result.critical_sos ?? 0,
          total_alerts: overview.total_alerts ?? result.total_alerts ?? 0,
          total_volunteers: volunteerData.total ?? overview.total_volunteers ?? 0,
          available_volunteers: volunteerData.available ?? overview.available_volunteers ?? 0,
          deployed_volunteers: volunteerData.deployed ?? 0,
          total_rescue_teams: rescue.total_teams ?? overview.total_rescue_teams ?? 0,
          available_rescue_teams: rescue.available_teams ?? overview.available_rescue_teams ?? 0,
          deployed_rescue_teams: rescue.deployed_teams ?? 0,
          total_rescue_members: rescue.total_members ?? 0,
          message: result.message || "Live emergency operations data",
        });
      } catch (error) {
        console.error(
          "User dashboard error:",
          error
        );

        setError(
          "Unable to load dashboard information."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* ============================================================
     FETCH ALERTS
  ============================================================ */

  const fetchAlerts = useCallback(
    async () => {
      try {
        setAlertsLoading(true);

        const response = await fetch(
          `${API_URL}/alerts`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Alerts request failed"
          );
        }

        const result =
          await response.json();

        const alertData: Alert[] =
          Array.isArray(result)
            ? result
            : result.alerts || [];

        const activeAlerts =
          alertData.filter(
            (alert) =>
              alert.status?.toUpperCase() ===
              "ACTIVE"
          );

        setAlerts(activeAlerts);
      } catch (error) {
        console.error(
          "User alerts error:",
          error
        );
      } finally {
        setAlertsLoading(false);
      }
    },
    []
  );

  const fetchNotifications = useCallback(async () => {
    try {
      const savedUser = localStorage.getItem("disaster_user");
      const user = savedUser ? JSON.parse(savedUser) : null;
      if (!user?.id) return;
      const response = await fetch(
        `${API_URL}/notifications?user_id=${encodeURIComponent(user.id)}`,
        { cache: "no-store" }
      );
      if (response.ok) {
        const result = await response.json();
        setNotifications(result.notifications || []);
      }
    } catch (notificationError) {
      console.error("User notifications error:", notificationError);
    }
  }, []);

  /* ============================================================
     FETCH SOS
  ============================================================ */

  const fetchSOS = useCallback(
    async () => {
      try {
        setSosLoading(true);
        setSosError("");

        const response = await fetch(
          `${API_URL}/sos`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "SOS request failed"
          );
        }

        const result =
          await response.json();

        const sosData: SOSRequest[] =
          Array.isArray(result)
            ? result
              : result.sos_requests || result.sos || [];

        setSosRequests(sosData);
      } catch (error) {
        console.error(
          "User SOS error:",
          error
        );

        setSosError(
          "Unable to load SOS requests."
        );
      } finally {
        setSosLoading(false);
      }
    },
    []
  );

  /* ============================================================
     FETCH DISASTERS
  ============================================================ */

  const fetchDisasters = useCallback(
    async () => {
      try {
        setMapLoading(true);
        setMapError("");

        const response = await fetch(
          `${API_URL}/disasters`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Disaster request failed"
          );
        }

        const result =
          await response.json();

        setDisasters(
          Array.isArray(result)
            ? result
            : result.disasters || []
        );
      } catch (error) {
        console.error(
          "Disaster map error:",
          error
        );
        setMapError("Unable to load disaster locations.");
      } finally {
        setMapLoading(false);
      }
    },
    []
  );

  /* ============================================================
     GET USER LOCATION FOR EVACUATION
  ============================================================ */

  const getUserLocation =
    useCallback(
      async () => {
        if (!navigator.geolocation) {
          throw new Error(
            "Geolocation is not supported by this browser."
          );
        }

        const position =
          await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 30000,
                }
              );
            }
          );

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        setUserLatitude(latitude);
        setUserLongitude(longitude);

        return {
          latitude,
          longitude,
        };
      },
      []
    );

  /* ============================================================
     INITIAL LOAD
  ============================================================ */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchDashboard();
      void fetchAlerts();
      void fetchNotifications();
      void fetchSOS();
      void fetchDisasters();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    fetchDashboard,
    fetchAlerts,
    fetchNotifications,
    fetchSOS,
    fetchDisasters,
  ]);

  /* ============================================================
     AUTO REFRESH
  ============================================================ */

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboard();
      fetchAlerts();
      fetchSOS();
      fetchDisasters();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [
    fetchDashboard,
    fetchAlerts,
    fetchSOS,
    fetchDisasters,
  ]);

  /* ============================================================
     ONE TAP SOS
  ============================================================ */

  const activateOneTapSOS =
    async () => {
      try {
        setSosSending(true);
        setSosMessage("");

        if (!navigator.geolocation) {
          throw new Error(
            "Geolocation is not supported."
          );
        }

        const position =
          await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 0,
                }
              );
            }
          );

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        const response =
          await fetch(
            `${API_URL}/sos/one-tap`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                name: "Emergency User",
                location:
                  "Current GPS Location",
                people: 1,
                latitude,
                longitude,
              }),
            }
          );

        if (!response.ok) {
          throw new Error(
            "SOS activation failed"
          );
        }

        const result =
          await response.json();

        if (!result.success) {
          throw new Error(
            result.message ||
              "SOS activation failed"
          );
        }

        setSosMessage(
          `🚨 SOS #${result.sos_id} activated successfully. Your GPS location has been sent to the response system.`
        );

        await fetchDashboard();
        await fetchSOS();
      } catch (error) {
        console.error(
          "One-Tap SOS error:",
          error
        );

        setSosMessage(
          "❌ Unable to activate SOS. Please allow location access and try again."
        );
      } finally {
        setSosSending(false);
      }
    };

  /* ============================================================
     DETAILED SOS
  ============================================================ */

  const submitDetailedSOS =
    async () => {
      if (!formName.trim()) {
        setFormMessage(
          "Please enter your name."
        );
        return;
      }

      if (!formLocation.trim()) {
        setFormMessage(
          "Please enter your location."
        );
        return;
      }

      if (!formEmergency.trim()) {
        setFormMessage(
          "Please describe the emergency."
        );
        return;
      }

      if (formPeople < 1) {
        setFormMessage(
          "People count must be at least 1."
        );
        return;
      }

      try {
        setFormSending(true);
        setFormMessage("");

        let latitude:
          | number
          | null = null;

        let longitude:
          | number
          | null = null;

        try {
          if (navigator.geolocation) {
            const position =
              await new Promise<GeolocationPosition>(
                (resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                      enableHighAccuracy: true,
                      timeout: 7000,
                      maximumAge: 30000,
                    }
                  );
                }
              );

            latitude =
              position.coords.latitude;

            longitude =
              position.coords.longitude;
          }
        } catch {
          console.warn(
            "GPS unavailable for detailed SOS."
          );
        }

        const response =
          await fetch(
            `${API_URL}/sos`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                name: formName,
                phone:
                  formPhone || null,
                location:
                  formLocation,
                people:
                  formPeople,
                emergency:
                  formEmergency,
                priority:
                  formPriority,
                latitude,
                longitude,
                description:
                  formDescription ||
                  null,
              }),
            }
          );

        if (!response.ok) {
          throw new Error(
            "Detailed SOS failed"
          );
        }

        const result =
          await response.json();

        if (!result.success) {
          throw new Error(
            result.message ||
              "Unable to create SOS"
          );
        }

        setFormMessage(
          `🚨 SOS #${result.sos?.id || ""} submitted successfully.`
        );

        setFormName("");
        setFormPhone("");
        setFormLocation("");
        setFormPeople(1);
        setFormEmergency("");
        setFormDescription("");
        setFormPriority("HIGH");

        await fetchDashboard();
        await fetchSOS();
      } catch (error) {
        console.error(
          "Detailed SOS error:",
          error
        );

        setFormMessage(
          "❌ Unable to submit SOS request."
        );
      } finally {
        setFormSending(false);
      }
    };

  /* ============================================================
     EVACUATION ROUTE
  ============================================================ */

  const startEvacuationRoute =
    async () => {
      try {
        setEvacuationSending(true);
        setEvacuationMessage("");

        const destination =
          evacuationDestination.trim();

        if (!destination) {
          setEvacuationMessage(
            "❌ Please enter an evacuation destination."
          );
          return;
        }

        /*
         * Try to get live GPS first.
         */
        let latitude =
          userLatitude;

        let longitude =
          userLongitude;

        try {
          const location =
            await getUserLocation();

          latitude =
            location.latitude;

          longitude =
            location.longitude;
        } catch (error) {
          console.warn(
            "GPS unavailable:",
            error
          );

          /*
           * We can still open Google Maps.
           */
        }

        openGoogleMapsRoute(
          destination,
          latitude,
          longitude
        );

        if (
          latitude !== null &&
          latitude !== undefined &&
          longitude !== null &&
          longitude !== undefined
        ) {
          setEvacuationMessage(
            "🛣️ Evacuation route opened in Google Maps using your current GPS location."
          );
        } else {
          setEvacuationMessage(
            "🗺️ Google Maps route opened. Please select your current location if required."
          );
        }
      } catch (error) {
        console.error(
          "Evacuation route error:",
          error
        );

        setEvacuationMessage(
          "❌ Unable to open evacuation route."
        );
      } finally {
        setEvacuationSending(false);
      }
    };

  /* ============================================================
     QUICK ROUTE FROM ALERT
  ============================================================ */

  const openAlertRoute =
    async (alert: Alert) => {
      try {
        let latitude =
          userLatitude;

        let longitude =
          userLongitude;

        try {
          const location =
            await getUserLocation();

          latitude =
            location.latitude;

          longitude =
            location.longitude;
        } catch {
          console.warn(
            "GPS unavailable for alert route."
          );
        }

        /*
         * If alert has coordinates,
         * use those as destination.
         */
        if (
          alert.latitude !== null &&
          alert.latitude !== undefined &&
          alert.longitude !== null &&
          alert.longitude !== undefined
        ) {
          openGoogleMapsRoute(
            `${alert.latitude},${alert.longitude}`,
            latitude,
            longitude
          );

          return;
        }

        /*
         * Otherwise use alert location text.
         */
        openGoogleMapsRoute(
          alert.location,
          latitude,
          longitude
        );
      } catch (error) {
        console.error(
          "Alert evacuation route error:",
          error
        );
      }
    };

  /* ============================================================
     MAP FILTER LABEL
  ============================================================ */

  const getFilterLabel = () => {
    if (mapFilter === "HIGH") {
      return "High / Critical Risk";
    }

    if (mapFilter === "MEDIUM") {
      return "Medium Risk";
    }

    if (mapFilter === "LOW") {
      return "Low Risk";
    }

    return "All Districts";
  };

  /* ============================================================
     COUNTS
  ============================================================ */

  const activeSOS =
    sosRequests.filter(
      (sos) =>
        ![
          "RESOLVED",
          "CANCELLED",
        ].includes(
          sos.status?.toUpperCase()
        )
    );

  const criticalSOS =
    sosRequests.filter(
      (sos) =>
        sos.priority?.toUpperCase() ===
        "CRITICAL"
    );

  /* ============================================================
     UI
  ============================================================ */

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">

          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              👤 User Emergency Dashboard
            </h1>

            <p className="text-xs text-slate-400 sm:text-sm">
              Rakshak Ai
            </p>
          </div>

          <div className="rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-xs font-bold text-green-400">
            ● SYSTEM ONLINE
          </div>

        </div>

      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ====================================================
            WELCOME
        ==================================================== */}

        <div className="mb-8">

          <h2 className="text-3xl font-bold">
            Emergency Response Center
          </h2>

          <p className="mt-2 text-slate-400">
            Monitor disaster alerts, send emergency
            requests, navigate evacuation routes,
            and track response status.
          </p>

        </div>

        <div className="mb-8 grid gap-4 overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-slate-900 to-red-500/10 p-5 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-2xl">
              <span className="absolute h-8 w-8 animate-ping rounded-full border border-cyan-400/40" />
              <span className="relative">⌁</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                Emergency network
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Alerts, shelters and response teams are synchronized for your area.
              </p>
            </div>
          </div>
          <div className="flex gap-1 md:justify-end">
            {["bg-cyan-400", "bg-green-400", "bg-yellow-400", "bg-red-400", "bg-cyan-400"].map((color, index) => (
              <span key={index} className={`h-8 w-1.5 rounded-full ${color} ${index === 3 ? "opacity-90" : "opacity-50"}`} />
            ))}
          </div>
        </div>

        {/* ====================================================
            STATS
        ==================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-red-500/20 bg-slate-900 p-5">

            <p className="text-sm text-slate-400">
              Total SOS
            </p>

            <p className="mt-2 text-3xl font-bold">
              {sosLoading
                ? "..."
                : sosRequests.length}
            </p>

            <p className="mt-2 text-xs text-red-400">
              Emergency requests
            </p>

          </div>

          <div className="rounded-2xl border border-orange-500/20 bg-slate-900 p-5">

            <p className="text-sm text-slate-400">
              Active SOS
            </p>

            <p className="mt-2 text-3xl font-bold">
              {sosLoading
                ? "..."
                : activeSOS.length}
            </p>

            <p className="mt-2 text-xs text-orange-400">
              Awaiting resolution
            </p>

          </div>

          <div className="rounded-2xl border border-red-500/20 bg-slate-900 p-5">

            <p className="text-sm text-slate-400">
              Critical SOS
            </p>

            <p className="mt-2 text-3xl font-bold text-red-400">
              {sosLoading
                ? "..."
                : criticalSOS.length}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Highest priority
            </p>

          </div>

          <div className="rounded-2xl border border-orange-500/20 bg-slate-900 p-5">

            <p className="text-sm text-slate-400">
              Active Alerts
            </p>

            <p className="mt-2 text-3xl font-bold">
              {alertsLoading
                ? "..."
                : alerts.length}
            </p>

            <p className="mt-2 text-xs text-orange-400">
              Live disaster alerts
            </p>

          </div>

        </div>

        {/* ====================================================
            EMERGENCY SOS
        ==================================================== */}

        <div className="mt-8 rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-950/60 via-slate-900 to-slate-900 p-6 sm:p-8">

          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

            <div className="max-w-2xl">

              <div className="flex items-center gap-3">

                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
                  🚨
                </span>

                <div>

                  <p className="text-sm font-bold uppercase tracking-wider text-red-400">
                    Emergency Response
                  </p>

                  <h2 className="text-2xl font-bold">
                    One-Tap Emergency SOS
                  </h2>

                </div>

              </div>

              <p className="mt-5 text-sm leading-6 text-slate-400">
                Send your current GPS location
                directly to the disaster response
                system. Your request automatically
                receives CRITICAL priority.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">

                <span className="rounded-full bg-red-500/10 px-3 py-2 text-red-400">
                  📍 GPS Location
                </span>

                <span className="rounded-full bg-red-500/10 px-3 py-2 text-red-400">
                  🚨 Critical Priority
                </span>

                <span className="rounded-full bg-red-500/10 px-3 py-2 text-red-400">
                  ⚡ Instant Response
                </span>

              </div>

            </div>

            <button
              onClick={activateOneTapSOS}
              disabled={sosSending}
              className="min-w-[220px] rounded-2xl bg-red-600 px-8 py-5 text-lg font-bold shadow-xl shadow-red-950/40 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sosSending
                ? "📡 Sending..."
                : "🚨 SEND SOS"}
            </button>

          </div>

          {sosMessage && (
            <div
              className={`mt-6 rounded-xl border p-4 text-sm ${
                sosMessage.startsWith("🚨")
                  ? "border-green-500/30 bg-green-500/10 text-green-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              {sosMessage}
            </div>
          )}

        </div>

        {/* ====================================================
            EVACUATION ROUTES
        ==================================================== */}

        <div className="mt-6 overflow-hidden rounded-2xl border border-blue-500/20 bg-slate-900">

          <button
            onClick={() =>
              setEvacuationOpen(
                !evacuationOpen
              )
            }
            className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-slate-800/50"
          >

            <div>

              <div className="flex flex-wrap items-center gap-3">

                <h2 className="text-xl font-bold">
                  🛣️ Evacuation Routes
                </h2>

                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">
                  GOOGLE MAPS
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-400">
                Find a safe evacuation route from
                your current location.
              </p>

            </div>

            <span className="text-xl text-slate-400">
              {evacuationOpen
                ? "▲"
                : "▼"}
            </span>

          </button>

          {evacuationOpen && (
            <div className="border-t border-slate-800 p-6">

              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">

                <div>

                  <label className="text-sm text-slate-400">
                    Evacuation Destination
                  </label>

                  <input
                    value={evacuationDestination}
                    onChange={(e) =>
                      setEvacuationDestination(
                        e.target.value
                      )
                    }
                    placeholder="Enter safe area, city, district or destination"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition focus:border-blue-500"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Example: District Emergency
                    Centre, Mathura or another
                    known safe destination.
                  </p>

                </div>

                <button
                  onClick={startEvacuationRoute}
                  disabled={evacuationSending}
                  className="rounded-xl bg-blue-600 px-7 py-4 font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {evacuationSending
                    ? "📍 Getting Location..."
                    : "🛣️ Open Evacuation Route"}
                </button>

              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">

                <button
                  onClick={() => {
                    setEvacuationDestination(
                      "District Emergency Centre"
                    );
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 transition hover:border-blue-500 hover:bg-slate-800"
                >
                  🏢 Emergency Centre
                </button>

                <button
                  onClick={() => {
                    setEvacuationDestination(
                      "District Magistrate Office"
                    );
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 transition hover:border-blue-500 hover:bg-slate-800"
                >
                  🏛️ District Office
                </button>

                <button
                  onClick={() => {
                    setEvacuationDestination(
                      "Police Station"
                    );
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 transition hover:border-blue-500 hover:bg-slate-800"
                >
                  🚓 Police Station
                </button>

              </div>

              {evacuationMessage && (
                <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-300">
                  {evacuationMessage}
                </div>
              )}

              {userLatitude !== null &&
                userLongitude !== null && (
                  <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-xs text-green-300">
                    📍 GPS location ready:{" "}
                    {userLatitude.toFixed(5)},{" "}
                    {userLongitude.toFixed(5)}
                  </div>
                )}

            </div>
          )}

        </div>

        {/* ====================================================
            DETAILED SOS
        ==================================================== */}

        <div className="mt-6 overflow-hidden rounded-2xl border border-red-500/20 bg-slate-900">

          <button
            onClick={() =>
              setShowDetailedSOS(
                !showDetailedSOS
              )
            }
            className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-slate-800/50"
          >

            <div>

              <h2 className="text-lg font-bold">
                📝 Submit Detailed Emergency Request
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Provide additional information for
                rescue teams.
              </p>

            </div>

            <span className="text-xl text-slate-400">
              {showDetailedSOS
                ? "▲"
                : "▼"}
            </span>

          </button>

          {showDetailedSOS && (
            <div className="border-t border-slate-800 p-6">

              <div className="grid gap-5 md:grid-cols-2">

                <div>

                  <label className="text-sm text-slate-400">
                    Name
                  </label>

                  <input
                    value={formName}
                    onChange={(e) =>
                      setFormName(
                        e.target.value
                      )
                    }
                    placeholder="Your name"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-red-500"
                  />

                </div>

                <div>

                  <label className="text-sm text-slate-400">
                    Phone
                  </label>

                  <input
                    value={formPhone}
                    onChange={(e) =>
                      setFormPhone(
                        e.target.value
                      )
                    }
                    placeholder="Phone number"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-red-500"
                  />

                </div>

                <div>

                  <label className="text-sm text-slate-400">
                    Location
                  </label>

                  <input
                    value={formLocation}
                    onChange={(e) =>
                      setFormLocation(
                        e.target.value
                      )
                    }
                    placeholder="Village / City / District"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-red-500"
                  />

                </div>

                <div>

                  <label className="text-sm text-slate-400">
                    Number of People
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={formPeople}
                    onChange={(e) =>
                      setFormPeople(
                        Math.max(
                          1,
                          Number(
                            e.target.value
                          )
                        )
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-red-500"
                  />

                </div>

                <div>

                  <label className="text-sm text-slate-400">
                    Emergency Type
                  </label>

                  <input
                    value={formEmergency}
                    onChange={(e) =>
                      setFormEmergency(
                        e.target.value
                      )
                    }
                    placeholder="Flooding, trapped, medical emergency..."
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-red-500"
                  />

                </div>

                <div>

                  <label className="text-sm text-slate-400">
                    Priority
                  </label>

                  <select
                    value={formPriority}
                    onChange={(e) =>
                      setFormPriority(
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-red-500"
                  >

                    <option value="MEDIUM">
                      MEDIUM
                    </option>

                    <option value="HIGH">
                      HIGH
                    </option>

                    <option value="CRITICAL">
                      CRITICAL
                    </option>

                  </select>

                </div>

              </div>

              <div className="mt-5">

                <label className="text-sm text-slate-400">
                  Additional Description
                </label>

                <textarea
                  value={formDescription}
                  onChange={(e) =>
                    setFormDescription(
                      e.target.value
                    )
                  }
                  rows={4}
                  placeholder="Describe your situation..."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-red-500"
                />

              </div>

              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                {formMessage && (
                  <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                    {formMessage}
                  </div>
                )}

                <button
                  onClick={submitDetailedSOS}
                  disabled={formSending}
                  className="rounded-xl bg-red-600 px-7 py-3 font-bold transition hover:bg-red-500 disabled:opacity-50 sm:ml-auto"
                >
                  {formSending
                    ? "Submitting..."
                    : "🚨 Submit SOS"}
                </button>

              </div>

            </div>
          )}

        </div>

        {notifications.length > 0 && (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
            <h2 className="text-xl font-bold text-red-200">
              Flood warning for your area
            </h2>
            <div className="mt-3 space-y-2">
              {notifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-sm font-semibold text-red-100">{notification.title}</p>
                  <p className="mt-1 text-sm text-red-100/80">{notification.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================
            ACTIVE ALERTS
        ==================================================== */}

        <div className="mt-8 overflow-hidden rounded-2xl border border-orange-500/20 bg-slate-900">

          <button
            onClick={() =>
              setAlertsOpen(
                !alertsOpen
              )
            }
            className="flex w-full items-center justify-between px-6 py-5 text-left hover:bg-slate-800/50"
          >

            <div>

              <div className="flex flex-wrap items-center gap-3">

                <h2 className="text-xl font-bold">
                  🚨 Active Disaster Alerts
                </h2>

                <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
                  {alerts.length} Active
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-400">
                Live alerts generated by the disaster
                monitoring system.
              </p>

            </div>

            <span className="text-xl text-slate-400">
              {alertsOpen
                ? "▲"
                : "▼"}
            </span>

          </button>

          {alertsOpen && (
            <div className="border-t border-slate-800">

              {alertsLoading ? (
                <div className="p-8 text-center text-slate-400">
                  Loading alerts...
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-10 text-center">

                  <div className="text-4xl">
                    ✓
                  </div>

                  <p className="mt-3 font-semibold text-green-400">
                    No active disaster alerts
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    The system is currently monitoring
                    all active locations.
                  </p>

                </div>
              ) : (
                <div className="max-h-[650px] overflow-y-auto divide-y divide-slate-800">

                  {alerts
                    .slice()
                    .reverse()
                    .map((alert) => (
                      <div
                        key={alert.id}
                        className="p-6 transition hover:bg-slate-800/40"
                      >

                        <div className="flex gap-4">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-2xl">
                            🚨
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="font-bold">
                                {alert.title}
                              </h3>

                              <span className="rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-400">
                                ACTIVE
                              </span>

                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-300">
                              {alert.message}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">

                              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                                📍 {alert.location}
                              </span>

                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${getSeverityClass(
                                  alert.severity
                                )}`}
                              >
                                {alert.severity}
                              </span>

                              {alert.disaster_type && (
                                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                                  🌊{" "}
                                  {
                                    alert.disaster_type
                                  }
                                </span>
                              )}

                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-3">

                              <p className="text-xs text-slate-500">
                                Created:{" "}
                                {formatDate(
                                  alert.created_at
                                )}
                              </p>

                              <button
                                onClick={() =>
                                  openAlertRoute(
                                    alert
                                  )
                                }
                                className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-400 transition hover:bg-blue-500/20"
                              >
                                🛣️ Route to Alert Location
                              </button>

                            </div>

                          </div>

                        </div>

                      </div>
                    ))}

                </div>
              )}

            </div>
          )}

        </div>

        {/* ====================================================
            SOS REQUESTS
        ==================================================== */}

        <div className="mt-8 overflow-hidden rounded-2xl border border-red-500/20 bg-slate-900">

          <button
            onClick={() =>
              setMySosOpen(
                !mySosOpen
              )
            }
            className="flex w-full items-center justify-between px-6 py-5 text-left hover:bg-slate-800/50"
          >

            <div>

              <div className="flex flex-wrap items-center gap-3">

                <h2 className="text-xl font-bold">
                  🚨 Emergency SOS Requests
                </h2>

                <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
                  {sosRequests.length} Total
                </span>

                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
                  {activeSOS.length} Active
                </span>

                <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
                  {criticalSOS.length} Critical
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-400">
                Live emergency requests in the disaster
                response system.
              </p>

            </div>

            <span className="text-xl text-slate-400">
              {mySosOpen
                ? "▲"
                : "▼"}
            </span>

          </button>

          {mySosOpen && (
            <div className="border-t border-slate-800">

              {sosError && (
                <div className="m-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                  {sosError}
                </div>
              )}

              {sosLoading ? (
                <div className="p-8 text-center text-slate-400">
                  Loading SOS requests...
                </div>
              ) : sosRequests.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  No SOS requests found.
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-800">

                  {sosRequests.map(
                    (sos) => (
                      <div
                        key={sos.id}
                        className="p-6 transition hover:bg-slate-800/40"
                      >

                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                          <div className="flex gap-4">

                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${
                                sos.priority?.toUpperCase() ===
                                "CRITICAL"
                                  ? "bg-red-500/10"
                                  : "bg-orange-500/10"
                              }`}
                            >
                              🚨
                            </div>

                            <div>

                              <div className="flex flex-wrap items-center gap-2">

                                <h3 className="font-bold">
                                  {sos.name}
                                </h3>

                                <span
                                  className={`rounded-full border px-2 py-1 text-[10px] font-bold ${getStatusClass(
                                    sos.status
                                  )}`}
                                >
                                  {
                                    sos.status
                                  }
                                </span>

                              </div>

                              <p className="mt-2 text-sm text-slate-400">
                                📍{" "}
                                {
                                  sos.location
                                }
                              </p>

                              <p className="mt-1 text-sm text-slate-400">
                                👥{" "}
                                {
                                  sos.people
                                }{" "}
                                people •{" "}
                                {
                                  sos.emergency
                                }
                              </p>

                              {sos.description && (
                                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                  {
                                    sos.description
                                  }
                                </p>
                              )}

                              {sos.latitude !==
                                null &&
                                sos.longitude !==
                                  null && (
                                  <p className="mt-2 text-xs text-slate-500">
                                    📍 GPS:{" "}
                                    {sos.latitude.toFixed(
                                      5
                                    )}
                                    ,{" "}
                                    {sos.longitude.toFixed(
                                      5
                                    )}
                                  </p>
                                )}

                              {sos.created_at && (
                                <p className="mt-2 text-xs text-slate-600">
                                  Created:{" "}
                                  {formatDate(
                                    sos.created_at
                                  )}
                                </p>
                              )}

                            </div>

                          </div>

                          <div className="flex flex-wrap gap-2">

                            <span
                              className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${
                                sos.priority?.toUpperCase() ===
                                "CRITICAL"
                                  ? "bg-red-500/10 text-red-400"
                                  : sos.priority?.toUpperCase() ===
                                    "HIGH"
                                  ? "bg-orange-500/10 text-orange-400"
                                  : "bg-yellow-500/10 text-yellow-400"
                              }`}
                            >
                              {
                                sos.priority
                              }
                            </span>

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>
          )}

        </div>

        {/* ====================================================
            MAP
        ==================================================== */}

        <div className="mt-8">

          <div className="mb-4 rounded-2xl border border-blue-500/20 bg-slate-900 p-5">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="flex flex-wrap items-center gap-3">

                  <h2 className="text-xl font-bold">
                    🗺️ Live India Disaster Map
                  </h2>

                  <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
                    LIVE AI MONITORING
                  </span>

                </div>

                <p className="mt-1 text-sm text-slate-400">
                  Disaster risks, active alerts and
                  emergency SOS locations.
                </p>

              </div>

              <div className="flex items-center gap-3">

                <span className="text-sm text-slate-400">
                  Risk Filter
                </span>

                <select
                  value={mapFilter}
                  onChange={(e) =>
                    setMapFilter(
                      e.target
                        .value as MapFilter
                    )
                  }
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
                >

                  <option value="All">
                    🌊 All Districts
                  </option>

                  <option value="HIGH">
                    🔴 High / Critical
                  </option>

                  <option value="MEDIUM">
                    🟠 Medium Risk
                  </option>

                  <option value="LOW">
                    🟢 Low Risk
                  </option>

                </select>

              </div>

            </div>

            <div className="mt-4">

              <span className="text-xs uppercase tracking-wider text-slate-500">
                Currently viewing
              </span>

              <span className="ml-3 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">
                {getFilterLabel()}
              </span>

            </div>

          </div>

          {mapLoading && (
            <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-300">
              Loading disaster locations...
            </div>
          )}

          {mapError && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {mapError}
            </div>
          )}

          <DisasterMap
            disasters={disasters}
            sosRequests={sosRequests
              .filter(
                (request) =>
                  request.latitude != null &&
                  request.longitude != null
              )
              .map((request) => ({
                ...request,
                latitude: request.latitude!,
                longitude: request.longitude!,
                type: "sos",
              }))}
          />

        </div>

        <SafeShelters
          userLocation={
            userLatitude != null && userLongitude != null
              ? {
                  latitude: userLatitude,
                  longitude: userLongitude,
                }
              : null
          }
        />

        {/* ====================================================
            RESPONSE CAPACITY
        ==================================================== */}

        <div className="mt-8 grid gap-6 md:grid-cols-2">

          <div className="rounded-2xl border border-green-500/20 bg-slate-900 p-6">

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">
                  Volunteer network
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Community responders registered
                </p>
              </div>
              <span className="text-2xl">◌</span>
            </div>

            <p className="mt-2 text-4xl font-bold text-green-400">
              {loading
                ? "..."
                : dashboard?.available_volunteers ??
                  0}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {loading ? "Loading live availability" : `${dashboard?.total_volunteers ?? 0} total • ${dashboard?.deployed_volunteers ?? 0} deployed`}
            </p>

          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-slate-900 p-6">

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">
                  Rescue team fleet
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Field teams ready for dispatch
                </p>
              </div>
              <span className="text-2xl">◇</span>
            </div>

            <p className="mt-2 text-4xl font-bold text-blue-400">
              {loading
                ? "..."
                : dashboard?.available_rescue_teams ??
                  0}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {loading ? "Loading live readiness" : `${dashboard?.total_rescue_teams ?? 0} total • ${dashboard?.deployed_rescue_teams ?? 0} deployed • ${dashboard?.total_rescue_members ?? 0} members`}
            </p>

          </div>

        </div>

      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="mt-10 border-t border-slate-800 bg-slate-900">

        <div className="mx-auto max-w-7xl px-6 py-5 text-center text-xs text-slate-500">
          Rakshak Ai •
          Emergency SOS •
          Live Disaster Monitoring •
          AI Response Platform
        </div>

      </footer>

    </main>
  );
}