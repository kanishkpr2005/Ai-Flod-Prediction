"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapItem = {
  id: number | string;
  latitude: number;
  longitude: number;
  type?: string | null;
  severity?: string | null;
  priority?: string | null;
  title?: string | null;
  location?: string | null;
  message?: string | null;
  status?: string | null;
  people?: number | null;
  name?: string | null;
  phone?: string | null;
  emergency?: string | null;
  description?: string | null;
  unit_type?: string | null;
  team_type?: string | null;
  members?: number | null;
  disaster_type?: string | null;
  district?: string | null;
  state?: string | null;
  probability?: number | null;
  rainfall_probability?: number | null;
  weather_probability?: number | null;
  created_at?: string | null;
  assigned_unit_id?: number | null;
  assigned_team_id?: number | null;
  [key: string]: any;
};

type Props = {
  disasters?: MapItem[];
  sosRequests?: MapItem[];
  responseUnits?: MapItem[];
  responseTeams?: MapItem[];
  districtAlerts?: MapItem[];
  selectedSOS?: MapItem | null;
  onSelectSOS?: (sos: MapItem) => void;
};

// ============================================================
// CUSTOM GLOWING DIV ICONS
// ============================================================

function createSOSIcon(item: MapItem, isSelected: boolean) {
  const isCritical =
    item.priority?.toUpperCase() === "CRITICAL" ||
    item.severity?.toUpperCase() === "CRITICAL";
  const color = isCritical ? "#ef4444" : "#f97316";
  const size = isSelected ? 48 : 38;
  const people = item.people && item.people > 1 ? item.people : null;

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <!-- Outer Pulsating Radar Ring -->
      <div class="animate-beacon-ping" style="position: absolute; inset: -4px; border-radius: 9999px; background-color: ${color}; opacity: 0.6;"></div>
      
      <!-- Inner Glowing Pulse Core -->
      <div class="animate-beacon-pulse" style="position: relative; width: ${size - 10}px; height: ${size - 10}px; border-radius: 9999px; background: radial-gradient(circle at 30% 30%, #ff8a8a, ${color} 70%, #7f1d1d); border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px ${color};">
        <span style="font-size: ${size > 40 ? 18 : 14}px; line-height: 1;">🆘</span>
      </div>

      <!-- People Count Badge -->
      ${
        people
          ? `<span style="position: absolute; top: -3px; right: -4px; background: #0f172a; color: #f87171; border: 1px solid #ef4444; font-size: 10px; font-weight: 800; padding: 1px 4px; border-radius: 9999px; box-shadow: 0 2px 4px rgba(0,0,0,0.8);">👥${people}</span>`
          : ""
      }
    </div>
  `;

  return L.divIcon({
    className: "leaflet-sos-div-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function createAlertIcon(item: MapItem, isSelected: boolean) {
  const sev = (item.severity || "HIGH").toUpperCase();
  const color =
    sev === "CRITICAL" ? "#ef4444" : sev === "HIGH" ? "#f97316" : "#eab308";
  const size = isSelected ? 42 : 34;
  const icon =
    item.disaster_type?.toLowerCase().includes("flood") ||
    item.title?.toLowerCase().includes("flood")
      ? "🌊"
      : item.disaster_type?.toLowerCase().includes("fire")
      ? "🔥"
      : "⚠️";

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: ${color}; opacity: 0.35; filter: blur(3px);"></div>
      <div style="position: relative; width: ${size - 8}px; height: ${size - 8}px; border-radius: 9999px; background: radial-gradient(circle at 30% 30%, #fef08a, ${color} 75%, #78350f); border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px ${color};">
        <span style="font-size: 13px; line-height: 1;">${icon}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: "leaflet-alert-div-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function createResourceIcon(item: MapItem) {
  const isTeam = item.type === "team";
  const color = isTeam ? "#3b82f6" : "#10b981";
  const icon = isTeam ? "🚒" : "🚑";
  const size = 32;

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: ${color}; opacity: 0.3; filter: blur(2px);"></div>
      <div style="position: relative; width: ${size - 6}px; height: ${size - 6}px; border-radius: 9999px; background: radial-gradient(circle at 30% 30%, #e0f2fe, ${color} 80%, #0f172a); border: 1.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${color};">
        <span style="font-size: 13px; line-height: 1;">${icon}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: "leaflet-resource-div-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function createDistrictRiskIcon(item: MapItem) {
  const prob = item.probability ?? 0;
  const color = prob >= 70 ? "#ef4444" : prob >= 40 ? "#f97316" : "#3b82f6";
  const size = 30;

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="position: relative; width: ${size - 4}px; height: ${size - 4}px; border-radius: 8px; background: #0f172a; border: 2px solid ${color}; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 10px ${color};">
        <span style="font-size: 9px; font-weight: 800; color: ${color}; line-height: 1;">${prob}%</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: "leaflet-risk-div-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// ============================================================
// MAP CONTROLLER (RESIZE, AUTO-FIT & SOS FOCUS)
// ============================================================

function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function MapController({
  items,
  selectedSOS,
  triggerFit,
}: {
  items: MapItem[];
  selectedSOS?: MapItem | null;
  triggerFit: number;
}) {
  const map = useMap();
  const initialFitDone = useRef(false);

  // Auto-fit bounds on mount / triggerFit
  useEffect(() => {
    if (!items.length) return;

    const valid = items.filter(
      (item) =>
        Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
    );

    if (!valid.length) return;

    // Only fit if initial or explicitly triggered
    if (!initialFitDone.current || triggerFit > 0) {
      initialFitDone.current = true;
      const bounds = valid.map((item) => [
        item.latitude,
        item.longitude,
      ]) as [number, number][];

      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 12,
      });
    }
  }, [items, map, triggerFit]);

  // Smooth Fly-To when an SOS is selected
  useEffect(() => {
    if (
      selectedSOS &&
      Number.isFinite(selectedSOS.latitude) &&
      Number.isFinite(selectedSOS.longitude)
    ) {
      map.flyTo([selectedSOS.latitude, selectedSOS.longitude], 13, {
        duration: 1.4,
        easeLinearity: 0.25,
      });
    }
  }, [selectedSOS, map]);

  return null;
}

// ============================================================
// RICH MARKER POPUP
// ============================================================

function RichMarkerPopup({
  item,
  onFocus,
}: {
  item: MapItem;
  onFocus?: (item: MapItem) => void;
}) {
  const type = (item.type || "alert").toLowerCase();

  return (
    <Popup className="custom-dark-popup">
      <div className="min-w-[240px] max-w-[280px] p-1 text-slate-100">
        
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2">
          <div className="flex items-center gap-1.5 font-bold text-xs">
            {type === "sos" && <span className="text-red-400">🚨 EMERGENCY SOS</span>}
            {type === "alert" && <span className="text-amber-400">⚠️ DISASTER ALERT</span>}
            {type === "team" && <span className="text-blue-400">🚒 RESCUE TEAM</span>}
            {type === "unit" && <span className="text-emerald-400">🚑 RESPONSE UNIT</span>}
            {type === "district-risk" && <span className="text-cyan-400">🌐 FLOOD RISK ZONE</span>}
          </div>

          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
              item.priority?.toUpperCase() === "CRITICAL" ||
              item.severity?.toUpperCase() === "CRITICAL"
                ? "bg-red-500/20 text-red-300 border border-red-500/40"
                : item.priority?.toUpperCase() === "HIGH" ||
                  item.severity?.toUpperCase() === "HIGH"
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
            }`}
          >
            {item.priority || item.severity || item.status || "ACTIVE"}
          </span>
        </div>

        {/* Title & Location */}
        <h4 className="font-bold text-sm text-white">
          {item.title || item.name || item.district || "Location"}
        </h4>

        {item.location && (
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            📍 {item.location}
          </p>
        )}

        {/* SOS Specific Details */}
        {type === "sos" && (
          <div className="mt-3 space-y-1.5 rounded-xl border border-red-500/20 bg-red-950/20 p-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">People Affected:</span>
              <span className="font-bold text-red-300">👥 {item.people || 1} people</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-semibold text-white">{item.status || "PENDING"}</span>
            </div>
            {item.assigned_unit_id && (
              <div className="flex justify-between text-[11px] text-emerald-400">
                <span>Assigned Unit:</span>
                <span>Unit #{item.assigned_unit_id}</span>
              </div>
            )}
            {item.message && (
              <p className="mt-1.5 border-t border-red-500/20 pt-1.5 text-[11px] text-slate-300 italic">
                "{item.message}"
              </p>
            )}
          </div>
        )}

        {/* Alert Specific Details */}
        {type === "alert" && (
          <div className="mt-3 space-y-1.5 rounded-xl border border-slate-700 bg-slate-800/40 p-2.5 text-xs">
            {item.disaster_type && (
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="font-semibold text-white capitalize">{item.disaster_type}</span>
              </div>
            )}
            {item.message && (
              <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                {item.message}
              </p>
            )}
          </div>
        )}

        {/* Resource Details */}
        {(type === "team" || type === "unit") && (
          <div className="mt-3 space-y-1.5 rounded-xl border border-slate-700 bg-slate-800/40 p-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Type:</span>
              <span className="font-semibold text-white">{item.team_type || item.unit_type || "Tactical"}</span>
            </div>
            {item.members && (
              <div className="flex justify-between">
                <span className="text-slate-400">Members:</span>
                <span className="font-semibold text-blue-300">👥 {item.members}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Operational Status:</span>
              <span className="font-bold text-emerald-400">{item.status || "AVAILABLE"}</span>
            </div>
          </div>
        )}

        {/* District Risk Details */}
        {type === "district-risk" && (
          <div className="mt-3 space-y-1 rounded-xl border border-blue-500/20 bg-blue-950/20 p-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Flood Probability:</span>
              <span className="font-bold text-red-400">{item.probability ?? 0}%</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Rainfall Signal:</span>
              <span className="text-slate-200">{item.rainfall_probability ?? 0}%</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Weather Signal:</span>
              <span className="text-slate-200">{item.weather_probability ?? 0}%</span>
            </div>
          </div>
        )}

        {/* Coordinates & Actions */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-700/60 pt-2 text-[10px] text-slate-500">
          <span>
            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </span>
          {onFocus && (
            <button
              type="button"
              onClick={() => onFocus(item)}
              className="rounded-lg bg-blue-600/30 px-2 py-1 font-semibold text-blue-300 transition hover:bg-blue-600 hover:text-white"
            >
              🎯 Center Focus
            </button>
          )}
        </div>

      </div>
    </Popup>
  );
}

// ============================================================
// MAIN DISASTER MAP COMPONENT
// ============================================================

export default function DisasterMap({
  disasters = [],
  sosRequests = [],
  responseUnits = [],
  responseTeams = [],
  districtAlerts = [],
  selectedSOS = null,
  onSelectSOS,
}: Props) {
  const [filter, setFilter] = useState<"ALL" | "SOS" | "ALERTS" | "RESOURCES" | "RISKS">("ALL");
  const [isPlayingSOS, setIsPlayingSOS] = useState(false);
  const [sosPlayIndex, setSosPlayIndex] = useState(0);
  const [triggerFit, setTriggerFit] = useState(0);
  const [focusedItem, setFocusedItem] = useState<MapItem | null>(null);

  // Filtered valid SOS items
  const validSOS = useMemo(
    () =>
      sosRequests.filter(
        (item) =>
          item &&
          Number.isFinite(item.latitude) &&
          Number.isFinite(item.longitude)
      ),
    [sosRequests]
  );

  const validAlerts = useMemo(
    () =>
      disasters.filter(
        (item) =>
          item &&
          Number.isFinite(item.latitude) &&
          Number.isFinite(item.longitude)
      ),
    [disasters]
  );

  const validUnits = useMemo(
    () =>
      responseUnits.filter(
        (item) =>
          item &&
          Number.isFinite(item.latitude) &&
          Number.isFinite(item.longitude)
      ),
    [responseUnits]
  );

  const validTeams = useMemo(
    () =>
      responseTeams.filter(
        (item) =>
          item &&
          Number.isFinite(item.latitude) &&
          Number.isFinite(item.longitude)
      ),
    [responseTeams]
  );

  const validDistrictRisks = useMemo(
    () =>
      districtAlerts.filter(
        (item) =>
          item &&
          Number.isFinite(item.latitude) &&
          Number.isFinite(item.longitude)
      ),
    [districtAlerts]
  );

  const allItems = useMemo(
    () => [
      ...validAlerts,
      ...validSOS,
      ...validUnits,
      ...validTeams,
      ...validDistrictRisks,
    ],
    [validAlerts, validSOS, validUnits, validTeams, validDistrictRisks]
  );

  // Handle Play SOS / Cycle through emergencies
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingSOS && validSOS.length > 0) {
      timer = setInterval(() => {
        setSosPlayIndex((prev) => {
          const next = (prev + 1) % validSOS.length;
          const target = validSOS[next];
          setFocusedItem(target);
          if (onSelectSOS) onSelectSOS(target);
          return next;
        });
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isPlayingSOS, validSOS, onSelectSOS]);

  const handleManualPlayToggle = () => {
    if (validSOS.length === 0) return;
    if (!isPlayingSOS) {
      setIsPlayingSOS(true);
      const target = validSOS[sosPlayIndex % validSOS.length];
      setFocusedItem(target);
      if (onSelectSOS) onSelectSOS(target);
    } else {
      setIsPlayingSOS(false);
    }
  };

  const activeFocus = selectedSOS || focusedItem;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-950">
      
      {/* MAP INTERACTIVE TOP TOOLBAR */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2 pointer-events-auto">
        
        {/* Filter Pills */}
        <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 shadow-lg backdrop-blur-md text-xs">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              filter === "ALL" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            All ({allItems.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter("SOS")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition ${
              filter === "SOS" ? "bg-red-600 text-white shadow" : "text-red-400 hover:bg-red-500/10"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse"></span>
            SOS ({validSOS.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter("ALERTS")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              filter === "ALERTS" ? "bg-amber-600 text-white shadow" : "text-amber-400 hover:bg-amber-500/10"
            }`}
          >
            Alerts ({validAlerts.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter("RESOURCES")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              filter === "RESOURCES" ? "bg-emerald-600 text-white shadow" : "text-emerald-400 hover:bg-emerald-500/10"
            }`}
          >
            Resources ({validUnits.length + validTeams.length})
          </button>
        </div>

        {/* SOS Play & Recenter Controls */}
        <div className="flex items-center gap-1.5">
          {validSOS.length > 0 && (
            <button
              type="button"
              onClick={handleManualPlayToggle}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md transition ${
                isPlayingSOS
                  ? "border-red-500 bg-red-600 text-white animate-pulse"
                  : "border-slate-700/80 bg-slate-900/90 text-slate-200 hover:border-red-500 hover:text-white"
              }`}
            >
              <span>{isPlayingSOS ? "⏸ Pause SOS Player" : "▶ Play SOS Layer"}</span>
              <span className="rounded-full bg-red-500/30 px-1.5 py-0.2 text-[10px] text-red-200">
                {validSOS.length}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setTriggerFit((prev) => prev + 1)}
            title="Auto center and fit all markers"
            className="flex h-8 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/90 px-2.5 text-xs font-semibold text-slate-300 shadow-lg backdrop-blur-md transition hover:border-blue-500 hover:text-white"
          >
            🎯 Fit Map
          </button>
        </div>

      </div>

      {/* LEAFLET MAP CONTAINER */}
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <MapResizeFix />
        <MapController
          items={allItems}
          selectedSOS={activeFocus}
          triggerFit={triggerFit}
        />

        {/* LAYER SELECTOR */}
        <LayersControl position="bottomright">
          
          {/* Base Maps */}
          <LayersControl.BaseLayer checked name="🌌 Tactical Dark (Ops View)">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🛰️ Satellite Imagery (Esri)">
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🗺️ Street Map (OSM)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          {/* ===================================================
              LAYER 2: LIVE SOS EMERGENCY LAYER (TOP PRIORITY)
          =================================================== */}
          {(filter === "ALL" || filter === "SOS") && (
            <LayersControl.Overlay checked name="🚨 Layer 2: Live SOS Beacons (Top Priority)">
              <div style={{ display: "none" }}></div>
            </LayersControl.Overlay>
          )}

          {/* LAYER 1: WEATHER & DISASTER ALERTS */}
          {(filter === "ALL" || filter === "ALERTS") && (
            <LayersControl.Overlay checked name="⚠️ Layer 1: Active Disaster Alerts">
              <div style={{ display: "none" }}></div>
            </LayersControl.Overlay>
          )}

          {/* LAYER 3: RESPONSE UNITS & RESCUE TEAMS */}
          {(filter === "ALL" || filter === "RESOURCES") && (
            <LayersControl.Overlay checked name="🚑 Layer 3: Response Teams & Units">
              <div style={{ display: "none" }}></div>
            </LayersControl.Overlay>
          )}

          {/* LAYER 4: DISTRICT FLOOD RISKS */}
          {(filter === "ALL" || filter === "RISKS") && (
            <LayersControl.Overlay checked name="🌐 Layer 4: District Risk Zones">
              <div style={{ display: "none" }}></div>
            </LayersControl.Overlay>
          )}

        </LayersControl>

        {/* =====================================================
            RENDER DISTRICT RISK POLYGONS / CIRCLES
        ===================================================== */}
        {(filter === "ALL" || filter === "RISKS") &&
          validDistrictRisks.map((item, idx) => {
            const prob = item.probability ?? 0;
            const color =
              prob >= 70 ? "#ef4444" : prob >= 40 ? "#f97316" : "#3b82f6";
            return (
              <Circle
                key={`district-circle-${item.id || idx}`}
                center={[item.latitude, item.longitude]}
                radius={25000}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.18,
                  weight: 1.5,
                  dashArray: "4, 6",
                }}
              >
                <RichMarkerPopup item={item} onFocus={setFocusedItem} />
              </Circle>
            );
          })}

        {/* DISTRICT RISK BADGES */}
        {(filter === "ALL" || filter === "RISKS") &&
          validDistrictRisks.map((item, idx) => (
            <Marker
              key={`risk-badge-${item.id || idx}`}
              position={[item.latitude, item.longitude]}
              icon={createDistrictRiskIcon(item)}
            >
              <RichMarkerPopup item={item} onFocus={setFocusedItem} />
            </Marker>
          ))}

        {/* =====================================================
            LAYER 3: RESPONSE TEAMS & UNITS
        ===================================================== */}
        {(filter === "ALL" || filter === "RESOURCES") &&
          [...validUnits, ...validTeams].map((item, idx) => (
            <Marker
              key={`resource-${item.type}-${item.id || idx}`}
              position={[item.latitude, item.longitude]}
              icon={createResourceIcon(item)}
            >
              <RichMarkerPopup item={item} onFocus={setFocusedItem} />
            </Marker>
          ))}

        {/* =====================================================
            LAYER 1: DISASTER & WEATHER ALERTS
        ===================================================== */}
        {(filter === "ALL" || filter === "ALERTS") &&
          validAlerts.map((item, idx) => {
            const isSelected = activeFocus?.id === item.id;
            return (
              <Marker
                key={`alert-${item.id || idx}`}
                position={[item.latitude, item.longitude]}
                icon={createAlertIcon(item, isSelected)}
                zIndexOffset={100}
              >
                <RichMarkerPopup item={item} onFocus={setFocusedItem} />
              </Marker>
            );
          })}

        {/* =====================================================
            LAYER 2: LIVE SOS BEACONS (TOP PRIORITY LAYER)
        ===================================================== */}
        {(filter === "ALL" || filter === "SOS") &&
          validSOS.map((item, idx) => {
            const isSelected =
              activeFocus?.id === item.id ||
              (activeFocus?.type === "sos" && activeFocus?.id === item.id);
            return (
              <Marker
                key={`sos-${item.id || idx}`}
                position={[item.latitude, item.longitude]}
                icon={createSOSIcon(item, isSelected)}
                zIndexOffset={1000} // Keeps SOS on top layer
                eventHandlers={{
                  click: () => {
                    setFocusedItem(item);
                    if (onSelectSOS) onSelectSOS(item);
                  },
                }}
              >
                <RichMarkerPopup item={item} onFocus={setFocusedItem} />
              </Marker>
            );
          })}

      </MapContainer>
    </div>
  );
}