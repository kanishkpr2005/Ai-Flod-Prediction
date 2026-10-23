"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Compass,
  PhoneCall,
  Activity,
  Droplets,
  CloudRain,
  Navigation,
  ShieldCheck,
  ChevronRight,
  User,
  LogOut,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  ExternalLink,
  LifeBuoy,
  Info,
  Radio,
  FileText,
  AlertCircle
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";
import { deleteAccount } from "@/lib/api";

const DisasterMap = dynamic(() => import("@/components/DisasterMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 sm:h-96 w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-xs sm:text-sm text-slate-400">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 animate-spin text-blue-400" />
        <span>Loading live geospatial risk map...</span>
      </div>
    </div>
  ),
});

const SafeShelters = dynamic(() => import("@/components/SafeShelterMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400">
      Loading safe shelters...
    </div>
  ),
});

interface DistrictPrediction {
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  probability: number;
  rainfall_1d: number;
  rainfall_3d: number;
  rainfall_7d: number;
  rainfall_30d: number;
  rainfall_trend: string;
  prediction_status: string;
  last_updated: string;
  open_meteo_live_weather?: {
    precipitation_sum_mm?: number;
    wind_speed_kmh?: number;
  };
}

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

interface UserProfile {
  id?: number | string;
  name: string;
  email: string;
  role: string;
  area?: string;
  loginTime?: string;
}

const SEMANTIC_RISK_COLORS = {
  LOW: {
    badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    fill: "#10B981",
    label: "LOW RISK",
    bg: "bg-emerald-950/20 border-emerald-900/40",
  },
  MEDIUM: {
    badge: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
    fill: "#EAB308",
    label: "MEDIUM RISK",
    bg: "bg-yellow-950/20 border-yellow-900/40",
  },
  HIGH: {
    badge: "border-orange-500/40 bg-orange-500/10 text-orange-400",
    fill: "#F97316",
    label: "HIGH RISK",
    bg: "bg-orange-950/20 border-orange-900/40",
  },
  CRITICAL: {
    badge: "border-red-500/40 bg-red-500/10 text-red-400",
    fill: "#EF4444",
    label: "CRITICAL RISK",
    bg: "bg-red-950/20 border-red-900/40",
  },
};

export default function UserDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [districts, setDistricts] = useState<DistrictPrediction[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictPrediction | null>(null);
  const [districtSearch, setDistrictSearch] = useState("");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [mySosRequests, setMySosRequests] = useState<SOSRequest[]>([]);

  // Location state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsError, setGpsError] = useState("");

  // Loading & Error states
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  // SOS Execution state
  const [sosSending, setSosSending] = useState(false);
  const [sosMessage, setSosMessage] = useState("");
  const [activeSosId, setActiveSosId] = useState<number | null>(null);

  // Detailed SOS Modal state
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [detailedForm, setDetailedForm] = useState({
    name: "",
    phone: "",
    location: "",
    people: 1,
    emergency: "Flood Inundation & Rising Water",
    description: "",
    priority: "HIGH",
  });
  const [detailedSending, setDetailedSending] = useState(false);
  const [detailedError, setDetailedError] = useState("");

  // Account Settings Modal
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Evacuation route input
  const [evacDestination, setEvacDestination] = useState("District Safe Shelter");

  // Load user session from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("disaster_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        if (parsed.name) {
          setDetailedForm((prev) => ({ ...prev, name: parsed.name }));
        }
      }
    } catch (e) {
      console.warn("Unable to read session:", e);
    }
  }, []);

  // Fetch districts dataset & alerts
  const loadPlatformData = useCallback(async () => {
    setDataLoading(true);
    setDataError("");

    try {
      // 1. Load real district predictions from JSON
      const predRes = await fetch("/data/districts_predictions.json");
      let districtList: DistrictPrediction[] = [];
      if (predRes.ok) {
        districtList = await predRes.json();
        setDistricts(districtList);
      }

      // 2. Load alerts
      try {
        const alertRes = await fetch(`${API_BASE_URL}/alerts`, { cache: "no-store" });
        if (alertRes.ok) {
          const alertData = await alertRes.json();
          const items: Alert[] = Array.isArray(alertData) ? alertData : alertData.alerts || [];
          setAlerts(items.filter((a) => a.status?.toUpperCase() === "ACTIVE"));
        }
      } catch (alertErr) {
        console.warn("Alerts fetch warning:", alertErr);
      }

      // 3. Load user's recent SOS requests
      try {
        const sosRes = await fetch(`${API_BASE_URL}/sos`, { cache: "no-store" });
        if (sosRes.ok) {
          const sosData = await sosRes.json();
          const items: SOSRequest[] = Array.isArray(sosData) ? sosData : sosData.sos_requests || sosData.sos || [];
          setMySosRequests(items.slice(0, 5));
        }
      } catch (sosErr) {
        console.warn("SOS fetch warning:", sosErr);
      }

      // Default selected district: match user area or pick a high-profile monitored district
      if (districtList.length > 0) {
        const userArea = (user?.area || "").toLowerCase();
        const matched = userArea ? districtList.find((d) => d.district.toLowerCase().includes(userArea)) : null;
        setSelectedDistrict(matched || districtList.find((d) => d.risk_level === "CRITICAL") || districtList[0]);
      }
    } catch (err) {
      console.error("Data load error:", err);
      setDataError("Unable to synchronize district flood intelligence from backend.");
    } finally {
      setDataLoading(false);
    }
  }, [user?.area]);

  useEffect(() => {
    loadPlatformData();
  }, [loadPlatformData]);

  // GPS Location Locator
  const detectGpsLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);
    setGpsError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
        };
        setGpsCoords(coords);
        setGpsLoading(false);

        // Find closest district from dataset
        if (districts.length > 0) {
          let closest = districts[0];
          let minDistance = Number.MAX_VALUE;

          districts.forEach((d) => {
            const dist = Math.hypot(d.latitude - coords.latitude, d.longitude - coords.longitude);
            if (dist < minDistance) {
              minDistance = dist;
              closest = d;
            }
          });

          if (minDistance < 2.5) {
            setSelectedDistrict(closest);
          }
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(err.message || "Unable to acquire GPS coordinates.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [districts]);

  // Trigger GPS detection on mount
  useEffect(() => {
    detectGpsLocation();
  }, [detectGpsLocation]);

  // One-Tap SOS Handler
  const handleOneTapSOS = async () => {
    setSosSending(true);
    setSosMessage("");

    try {
      let lat = gpsCoords?.latitude;
      let lon = gpsCoords?.longitude;

      if (!lat || !lon) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 6000,
            });
          });
          lat = Number(pos.coords.latitude.toFixed(4));
          lon = Number(pos.coords.longitude.toFixed(4));
          setGpsCoords({ latitude: lat, longitude: lon });
        } catch {
          lat = selectedDistrict?.latitude || 27.1767;
          lon = selectedDistrict?.longitude || 78.0081;
        }
      }

      const res = await fetch(`${API_BASE_URL}/sos/one-tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user?.name || "Citizen In Need",
          location: selectedDistrict ? `${selectedDistrict.district}, ${selectedDistrict.state}` : "Current GPS Location",
          people: 1,
          latitude: lat,
          longitude: lon,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to trigger emergency SOS dispatch.");
      }

      const newId = data.sos_id || (data.sos && data.sos.id);
      setActiveSosId(newId);
      setSosMessage(`Emergency SOS #${newId} transmitted. GPS coordinates logged. Emergency Control Room notified.`);

      // Refresh SOS list
      const updatedRes = await fetch(`${API_BASE_URL}/sos`, { cache: "no-store" });
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json();
        const items: SOSRequest[] = Array.isArray(updatedData) ? updatedData : updatedData.sos_requests || [];
        setMySosRequests(items.slice(0, 5));
      }
    } catch (err: any) {
      console.error("SOS Trigger error:", err);
      setSosMessage(err.message || "Unable to activate SOS. Please dial 112 directly.");
    } finally {
      setSosSending(false);
    }
  };

  // Detailed SOS Submission
  const handleDetailedSosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailedSending(true);
    setDetailedError("");

    try {
      if (!detailedForm.name.trim() || !detailedForm.location.trim()) {
        throw new Error("Please provide your name and location.");
      }

      const res = await fetch(`${API_BASE_URL}/sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: detailedForm.name.trim(),
          phone: detailedForm.phone.trim() || null,
          location: detailedForm.location.trim(),
          people: Number(detailedForm.people) || 1,
          emergency: detailedForm.emergency,
          priority: detailedForm.priority,
          latitude: gpsCoords?.latitude || selectedDistrict?.latitude || null,
          longitude: gpsCoords?.longitude || selectedDistrict?.longitude || null,
          description: detailedForm.description.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit detailed emergency request.");
      }

      setShowDetailedModal(false);
      setActiveSosId(data.sos?.id || null);
      setSosMessage(`Detailed SOS #${data.sos?.id || ""} registered with Control Center.`);

      const updatedRes = await fetch(`${API_BASE_URL}/sos`, { cache: "no-store" });
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json();
        const items: SOSRequest[] = Array.isArray(updatedData) ? updatedData : updatedData.sos_requests || [];
        setMySosRequests(items.slice(0, 5));
      }
    } catch (err: any) {
      setDetailedError(err.message || "Failed to submit SOS.");
    } finally {
      setDetailedSending(false);
    }
  };

  // Google Maps Evacuation Route Navigation
  const launchGoogleMapsRoute = (destination: string) => {
    if (!destination.trim()) return;
    const origin = gpsCoords ? `${gpsCoords.latitude},${gpsCoords.longitude}` : (selectedDistrict ? `${selectedDistrict.district}, ${selectedDistrict.state}` : "");
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Account Logout
  const handleLogout = () => {
    localStorage.removeItem("disaster_user");
    router.push("/login");
  };

  // Account Deletion
  const handleDeleteAccount = async () => {
    if (!user?.email) {
      setDeleteError("No active user session detected.");
      return;
    }
    if (!deleteConfirmPassword.trim()) {
      setDeleteError("Please enter your current account password to confirm deletion.");
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const res: any = await deleteAccount({
        email: user.email,
        password: deleteConfirmPassword,
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to delete account. Verify password.");
      }

      localStorage.removeItem("disaster_user");
      alert("Your account and associated citizen notifications have been permanently removed.");
      router.push("/login");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered district search
  const filteredDistricts = useMemo(() => {
    if (!districtSearch.trim()) return [];
    const q = districtSearch.toLowerCase();
    return districts
      .filter((d) => d.district.toLowerCase().includes(q) || d.state.toLowerCase().includes(q))
      .slice(0, 8);
  }, [districts, districtSearch]);

  // District Alerts
  const districtAlerts = useMemo(() => {
    if (!selectedDistrict) return [];
    const distName = selectedDistrict.district.toLowerCase();
    const stateName = selectedDistrict.state.toLowerCase();
    return alerts.filter(
      (a) =>
        a.location.toLowerCase().includes(distName) ||
        a.location.toLowerCase().includes(stateName) ||
        a.title.toLowerCase().includes(distName)
    );
  }, [alerts, selectedDistrict]);

  // Active SOS to display in tracker
  const latestSos = mySosRequests[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-white">
      {/* ========================================================
          1. CITIZEN PORTAL TOP BAR
      ======================================================== */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                  AI Flood Prediction Platform
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400">
                  Citizen Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">District Early Warning & Emergency SOS</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick emergency hotlines */}
            <a
              href="tel:112"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition"
              title="National Emergency Helpline"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>112</span>
            </a>

            {/* User Profile / Settings */}
            <button
              onClick={() => setShowAccountModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300 text-xs font-medium transition"
            >
              <User className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden md:inline max-w-[120px] truncate">{user?.name || "Account"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          2. MAIN CONTENT AREA (MOBILE FIRST)
      ======================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Banner Notification for SOS */}
        {sosMessage && (
          <div className="rounded-xl border border-blue-500/40 bg-blue-950/40 p-4 flex items-start gap-3 animate-in fade-in">
            <Radio className="h-5 w-5 text-blue-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-200">{sosMessage}</p>
              <p className="text-xs text-blue-400/80 mt-1">
                Emergency services verify distress calls continuously. Keep your phone line free.
              </p>
            </div>
            <button onClick={() => setSosMessage("")} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ========================================================
            3. EMERGENCY SOS COMMAND SECTION
        ======================================================== */}
        <section className="rounded-2xl border border-red-900/40 bg-gradient-to-b from-red-950/30 via-slate-900/90 to-slate-900/90 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-red-900/30 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  EMERGENCY SOS DISPATCH
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Immediate distress signal transmission to District Disaster Management Authority (DDMA) & NDRF
              </p>
            </div>

            {/* GPS Detection Status */}
            <div className="flex items-center gap-2 text-xs bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300">
              <Compass className={`h-4 w-4 ${gpsLoading ? "animate-spin text-blue-400" : "text-emerald-400"}`} />
              {gpsLoading ? (
                <span>Acquiring satellite GPS...</span>
              ) : gpsCoords ? (
                <span>
                  GPS Lat: <strong className="text-white">{gpsCoords.latitude}</strong>, Lon:{" "}
                  <strong className="text-white">{gpsCoords.longitude}</strong>
                </span>
              ) : (
                <span className="text-amber-400">GPS not acquired (using district location)</span>
              )}
              <button
                onClick={detectGpsLocation}
                className="text-[11px] underline text-blue-400 hover:text-blue-300 ml-1"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* SOS Trigger Actions */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Primary ONE-TAP SOS Trigger */}
            <div className="md:col-span-2 flex flex-col justify-between rounded-xl border border-red-500/30 bg-red-950/20 p-4 sm:p-5">
              <div>
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                  Critical Situation
                </span>
                <h3 className="text-sm sm:text-base font-semibold text-white mt-1">
                  Immediate Rescue / Trapped in Rising Water
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Pressing this button broadcasts your exact coordinates directly into the Authority Command Center SOS
                  queue and alerts local rescue units.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleOneTapSOS}
                  disabled={sosSending}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-50 text-white font-bold text-sm sm:text-base tracking-wide flex items-center justify-center gap-3 shadow-lg shadow-red-900/30 transition"
                >
                  <Radio className={`h-5 w-5 ${sosSending ? "animate-spin" : "animate-pulse"}`} />
                  <span>{sosSending ? "TRANSMITTING SOS..." : "ONE-TAP EMERGENCY SOS"}</span>
                </button>

                <button
                  onClick={() => setShowDetailedModal(true)}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition"
                >
                  Specify Medical / Multiple People
                </button>
              </div>
            </div>

            {/* Quick Emergency Helplines Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Direct Helplines
                </span>
                <div className="mt-3 space-y-2.5">
                  <a
                    href="tel:1078"
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-xs transition"
                  >
                    <span className="text-slate-300 font-medium">NDMA Flood Control</span>
                    <strong className="text-red-400">1078</strong>
                  </a>
                  <a
                    href="tel:1070"
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-xs transition"
                  >
                    <span className="text-slate-300 font-medium">State Emergency Center</span>
                    <strong className="text-amber-400">1070</strong>
                  </a>
                  <a
                    href="tel:112"
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-xs transition"
                  >
                    <span className="text-slate-300 font-medium">National Police / Fire</span>
                    <strong className="text-blue-400">112</strong>
                  </a>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-3">Toll-free 24/7 lines operated by Government of India</p>
            </div>
          </div>

          {/* SOS Status Lifecycle Tracker (Only displays real backend states) */}
          {latestSos && (
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-blue-400" />
                  Your Active SOS Request (#{latestSos.id})
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    latestSos.status === "RESOLVED"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-red-500/40 bg-red-500/10 text-red-400"
                  }`}
                >
                  {latestSos.status}
                </span>
              </div>

              {/* 5-Stage Visual Progression */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
                {[
                  { label: "1. SOS RECEIVED", state: "PENDING", active: true },
                  {
                    label: "2. LOCATION LOGGED",
                    state: "VERIFIED",
                    active: !!latestSos.latitude || latestSos.status !== "PENDING",
                  },
                  {
                    label: "3. UNIT ASSIGNED",
                    state: "ASSIGNED",
                    active: ["ASSIGNED", "IN_PROGRESS", "RESOLVED"].includes(latestSos.status?.toUpperCase()),
                  },
                  {
                    label: "4. IN TRANSIT",
                    state: "IN_PROGRESS",
                    active: ["IN_PROGRESS", "RESOLVED"].includes(latestSos.status?.toUpperCase()),
                  },
                  {
                    label: "5. RESOLVED",
                    state: "RESOLVED",
                    active: latestSos.status?.toUpperCase() === "RESOLVED",
                  },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border transition ${
                      step.active
                        ? "border-blue-500/40 bg-blue-950/30 text-blue-300 font-semibold"
                        : "border-slate-800/60 bg-slate-950/40 text-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {step.active ? (
                        <CheckCircle2 className="h-3 w-3 text-blue-400" />
                      ) : (
                        <Clock className="h-3 w-3 text-slate-600" />
                      )}
                      <span>{step.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ========================================================
            4. LOCAL FLOOD RISK INTELLIGENCE SECTION
        ======================================================== */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-blue-400" />
                <span>LOCAL FLOOD RISK INTELLIGENCE</span>
              </h2>
              <p className="text-xs text-slate-400">
                District-level probability derived from Random Forest model & Open-Meteo live precipitation
              </p>
            </div>

            {/* District Search & Selector */}
            <div className="relative w-full sm:w-72">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search district (e.g. Agra, Patna)..."
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {filteredDistricts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-30 max-h-56 overflow-y-auto">
                  {filteredDistricts.map((d) => (
                    <button
                      key={`${d.district}-${d.state}`}
                      onClick={() => {
                        setSelectedDistrict(d);
                        setDistrictSearch("");
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-xs border-b border-slate-800/60 last:border-0"
                    >
                      <span className="font-medium text-slate-200">
                        {d.district}, {d.state}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          SEMANTIC_RISK_COLORS[d.risk_level]?.badge || ""
                        }`}
                      >
                        {d.risk_level}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected District Risk Card */}
          {selectedDistrict ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-6">
              {/* Header metrics */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-400" />
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {selectedDistrict.district}
                    </h3>
                    <span className="text-xs text-slate-400">({selectedDistrict.state})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>Monitored District Coordinates: {selectedDistrict.latitude.toFixed(4)}°N, {selectedDistrict.longitude.toFixed(4)}°E</span>
                    <span>•</span>
                    <span>Status: <strong className="text-slate-300">{selectedDistrict.prediction_status || "Current"}</strong></span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Flood Probability</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white">
                      {(selectedDistrict.probability * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div
                    className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold tracking-wider ${
                      SEMANTIC_RISK_COLORS[selectedDistrict.risk_level]?.badge
                    }`}
                  >
                    {SEMANTIC_RISK_COLORS[selectedDistrict.risk_level]?.label}
                  </div>
                </div>
              </div>

              {/* WHY THIS PREDICTION? (Truthful contributing factors in plain language) */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Info className="h-3.5 w-3.5 text-blue-400" />
                  Why is this risk level assigned? (Contributing Signals)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                    <span className="text-[11px] text-slate-400 block">24h Rainfall</span>
                    <strong className="text-base sm:lg font-bold text-white block mt-0.5">
                      {selectedDistrict.rainfall_1d ?? 0} mm
                    </strong>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {(selectedDistrict.rainfall_1d ?? 0) > 65 ? "Heavy Monsoon Rain" : "Moderate Precipitation"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                    <span className="text-[11px] text-slate-400 block">7-Day Accumulated</span>
                    <strong className="text-base sm:text-lg font-bold text-white block mt-0.5">
                      {selectedDistrict.rainfall_7d ?? 0} mm
                    </strong>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Soil saturation window</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                    <span className="text-[11px] text-slate-400 block">Rainfall Trend</span>
                    <strong className="text-base sm:text-lg font-bold text-white block mt-0.5 capitalize">
                      {selectedDistrict.rainfall_trend || "Stable"}
                    </strong>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">IMD 2024 Daily Feature</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                    <span className="text-[11px] text-slate-400 block">Live Weather Sync</span>
                    <strong className="text-base sm:text-lg font-bold text-emerald-400 block mt-0.5">
                      Open-Meteo Active
                    </strong>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {selectedDistrict.open_meteo_live_weather?.precipitation_sum_mm !== undefined
                        ? `${selectedDistrict.open_meteo_live_weather.precipitation_sum_mm} mm forecast`
                        : "Verified live feed"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Citizen-Friendly Safety Advisory */}
              <div
                className={`rounded-xl border p-4 text-xs ${
                  selectedDistrict.risk_level === "CRITICAL"
                    ? "border-red-500/40 bg-red-950/20 text-red-200"
                    : selectedDistrict.risk_level === "HIGH"
                    ? "border-orange-500/40 bg-orange-950/20 text-orange-200"
                    : selectedDistrict.risk_level === "MEDIUM"
                    ? "border-yellow-500/40 bg-yellow-950/20 text-yellow-200"
                    : "border-emerald-500/40 bg-emerald-950/20 text-emerald-200"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block mb-1">
                      Recommended Action for {selectedDistrict.district}:
                    </strong>
                    {selectedDistrict.risk_level === "CRITICAL" && (
                      <p>
                        High probability of severe inundation in low-lying areas. Move essential belongings to upper
                        floors, keep phone fully charged, identify nearest high ground or safe shelter, and prepare for
                        evacuation if instructed by local district authorities.
                      </p>
                    )}
                    {selectedDistrict.risk_level === "HIGH" && (
                      <p>
                        Elevated flood risk due to accumulated precipitation. Avoid riverbanks, waterlogged underpasses,
                        and stay tuned to official DDMA broadcasts. Review emergency evacuation routes.
                      </p>
                    )}
                    {selectedDistrict.risk_level === "MEDIUM" && (
                      <p>
                        Moderate rainfall conditions. Catchment basins are saturated. Monitor weather updates and avoid
                        non-essential travel across prone causeways.
                      </p>
                    )}
                    {selectedDistrict.risk_level === "LOW" && (
                      <p>
                        Normal operational conditions. Precipitation is within safe thresholds. No immediate flood risk
                        detected for this district.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-400">
              No district selected. Use the search box above or GPS button to locate your district.
            </div>
          )}
        </section>

        {/* ========================================================
            5. ACTIVE DISTRICT ALERTS & MAP
        ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Alerts for User's Area */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Active District Flood Warnings
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300">
                  {districtAlerts.length} Active in Region
                </span>
              </div>

              {districtAlerts.length > 0 ? (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {districtAlerts.map((alt) => (
                    <div
                      key={alt.id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-xs font-semibold text-white">{alt.title}</strong>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            alt.severity?.toUpperCase() === "CRITICAL"
                              ? "border-red-500/40 bg-red-500/10 text-red-400"
                              : "border-amber-500/40 bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {alt.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alt.message}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Location: {alt.location}</span>
                        <span>Issued: {new Date(alt.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-300">No Active Emergency Warnings</p>
                  <p className="text-slate-500 text-[11px] mt-1">
                    There are currently no active flood emergency notices issued for {selectedDistrict?.district || "your selected area"}.
                  </p>
                </div>
              )}
            </div>

            {/* Evacuation Route Navigator */}
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Emergency Evacuation Navigation (Google Maps)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={evacDestination}
                  onChange={(e) => setEvacDestination(e.target.value)}
                  placeholder="Enter high ground / shelter destination..."
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => launchGoogleMapsRoute(evacDestination)}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Navigate</span>
                </button>
              </div>
            </div>
          </div>

          {/* District Geospatial Context */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  District Risk Context
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">590 Monitored Districts</span>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-800 h-72 sm:h-80">
              <DisasterMap />
            </div>

            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Green: Low • Yellow: Medium • Orange: High • Red: Critical
            </p>
          </div>
        </div>

        {/* ========================================================
            6. NEARBY EMERGENCY SAFE SHELTERS
        ======================================================== */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-blue-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Designated Safe Shelters & Relief Camps
              </h2>
            </div>
            <span className="text-xs text-slate-400">Distance calculated from current GPS</span>
          </div>

          <SafeShelters userLocation={gpsCoords} />
        </section>

        {/* ========================================================
            7. NDMA CITIZEN FLOOD PROTOCOLS & GUIDELINES
        ======================================================== */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span>National Disaster Management Authority (NDMA) Safety Protocol</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
              <strong className="text-white font-semibold block mb-1.5 text-sm">Before Flood / Early Warning</strong>
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                <li>Store clean drinking water and non-perishable food for at least 72 hours.</li>
                <li>Keep waterproof bags ready with identity documents, medicines, and torches.</li>
                <li>Identify high-elevation routes and nearest district relief shelters.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
              <strong className="text-white font-semibold block mb-1.5 text-sm">During Rising Water</strong>
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                <li>Switch off main electrical breakers and gas cylinders before evacuating.</li>
                <li>Never attempt to walk or drive through moving flood water deeper than 15 cm.</li>
                <li>Move livestock and family members to upper levels or designated high ground.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
              <strong className="text-white font-semibold block mb-1.5 text-sm">Emergency Evacuation</strong>
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                <li>Follow instructions from NDRF, SDRF, and civil defense volunteers immediately.</li>
                <li>Trigger One-Tap SOS on this platform if trapped or cut off from evacuation.</li>
                <li>Keep distress flares, bright cloth, or whistles ready for search & rescue teams.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================
          8. FOOTER
      ======================================================== */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AI Flood Prediction Platform • Emergency Public Warning System</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-300 transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition">Terms of Service</Link>
          </div>
        </div>
      </footer>

      {/* ========================================================
          9. DETAILED SOS MODAL
      ======================================================== */}
      {showDetailedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                <h3 className="text-base font-bold text-white">Detailed Emergency Dispatch</h3>
              </div>
              <button
                onClick={() => setShowDetailedModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailedError && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
                {detailedError}
              </div>
            )}

            <form onSubmit={handleDetailedSosSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={detailedForm.name}
                  onChange={(e) => setDetailedForm({ ...detailedForm, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={detailedForm.phone}
                    onChange={(e) => setDetailedForm({ ...detailedForm, phone: e.target.value })}
                    placeholder="Mobile number"
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">People Trapped *</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={detailedForm.people}
                    onChange={(e) => setDetailedForm({ ...detailedForm, people: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Location / Landmark *</label>
                <input
                  type="text"
                  required
                  value={detailedForm.location}
                  onChange={(e) => setDetailedForm({ ...detailedForm, location: e.target.value })}
                  placeholder="e.g. Near Railway Bridge, Sector 4, Agra"
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Emergency Category</label>
                <select
                  value={detailedForm.emergency}
                  onChange={(e) => setDetailedForm({ ...detailedForm, emergency: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Flood Inundation & Rising Water">Flood Inundation & Rising Water</option>
                  <option value="Trapped on Rooftop / High Ground">Trapped on Rooftop / High Ground</option>
                  <option value="Medical Emergency / Critical Condition">Medical Emergency / Critical Condition</option>
                  <option value="Elderly / Infants Evacuation Needed">Elderly / Infants Evacuation Needed</option>
                  <option value="Food & Drinking Water Shortage">Food & Drinking Water Shortage</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Additional Observations / Needs</label>
                <textarea
                  rows={2}
                  value={detailedForm.description}
                  onChange={(e) => setDetailedForm({ ...detailedForm, description: e.target.value })}
                  placeholder="e.g. Water is waist-deep and rising fast. Two senior citizens present."
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDetailedModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={detailedSending}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  {detailedSending ? "Submitting..." : "Transmit Distress Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          10. ACCOUNT & SETTINGS MODAL (Includes Delete Account)
      ======================================================== */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Citizen Account Profile</h3>
              </div>
              <button
                onClick={() => {
                  setShowAccountModal(false);
                  setDeleteError("");
                  setDeleteConfirmPassword("");
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Name:</span>
                <span className="font-semibold text-white">{user?.name || "Citizen User"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Email:</span>
                <span className="font-semibold text-white">{user?.email || "Not specified"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Role:</span>
                <span className="font-semibold text-blue-400">{user?.role || "USER"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Registered Alert Area:</span>
                <span className="font-semibold text-white">{user?.area || "All Districts"}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 space-y-3">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out of Citizen Session</span>
              </button>

              {/* Delete Account Section */}
              <div className="pt-4 border-t border-red-950/50">
                <span className="text-xs font-semibold text-red-400 block mb-1">
                  Danger Zone: Delete Account
                </span>
                <p className="text-[11px] text-slate-400 mb-2">
                  Permanently deletes your account credentials and notification subscriptions.
                </p>

                {deleteError && (
                  <div className="p-2.5 mb-2 rounded border border-red-500/30 bg-red-500/10 text-[11px] text-red-300">
                    {deleteError}
                  </div>
                )}

                <div className="space-y-2">
                  <input
                    type="password"
                    placeholder="Enter password to confirm deletion..."
                    value={deleteConfirmPassword}
                    onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-red-900/40 bg-slate-950 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="w-full py-2 rounded-lg border border-red-600/40 bg-red-950/30 hover:bg-red-900/50 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{deleteLoading ? "Deleting Account..." : "Permanently Delete Account"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}