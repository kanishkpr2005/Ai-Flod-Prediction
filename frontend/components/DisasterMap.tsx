"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
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
// SLEEK, SIMPLE & INTERACTIVE DOT ICONS
// ============================================================

function createSimpleSOSIcon(isSelected: boolean) {
  const size = isSelected ? 22 : 16;
  const pingSize = size + 10;

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <!-- Subtle Expanding Radar Ping -->
      <div class="animate-beacon-ping" style="position: absolute; width: ${pingSize}px; height: ${pingSize}px; border-radius: 9999px; background-color: #ef4444; opacity: 0.5;"></div>
      
      <!-- Solid Crisp Red Core -->
      <div style="position: relative; width: ${size}px; height: ${size}px; border-radius: 9999px; background-color: #ef4444; border: 2px solid #ffffff; box-shadow: 0 0 10px rgba(239, 68, 68, 0.9); display: flex; align-items: center; justify-content: center; transition: transform 0.15s ease;">
        <div style="width: 4px; height: 4px; border-radius: 9999px; background-color: #ffffff;"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    className: "leaflet-simple-sos-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function createSimpleAlertIcon(severity: string | null | undefined, isSelected: boolean) {
  const sev = (severity || "HIGH").toUpperCase();
  const color = sev === "CRITICAL" ? "#ef4444" : sev === "HIGH" ? "#f97316" : "#eab308";
  const size = isSelected ? 18 : 14;

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="width: ${size}px; height: ${size}px; border-radius: 9999px; background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 0 8px ${color}; transition: transform 0.15s ease;"></div>
    </div>
  `;

  return L.divIcon({
    className: "leaflet-simple-alert-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function createSimpleResourceIcon(type: string | null | undefined, isSelected: boolean) {
  const isTeam = type === "team";
  const color = isTeam ? "#3b82f6" : "#10b981";
  const size = isSelected ? 16 : 12;

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="width: ${size}px; height: ${size}px; border-radius: 9999px; background-color: ${color}; border: 1.5px solid #ffffff; box-shadow: 0 0 6px ${color};"></div>
    </div>
  `;

  return L.divIcon({
    className: "leaflet-simple-resource-icon",
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

  useEffect(() => {
    if (!items.length) return;

    const valid = items.filter(
      (item) =>
        Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
    );

    if (!valid.length) return;

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

  useEffect(() => {
    if (
      selectedSOS &&
      Number.isFinite(selectedSOS.latitude) &&
      Number.isFinite(selectedSOS.longitude)
    ) {
      map.flyTo([selectedSOS.latitude, selectedSOS.longitude], 13, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [selectedSOS, map]);

  return null;
}

// ============================================================
// CLEAN GLASSMORPHIC MARKER POPUP
// ============================================================

function SimpleMarkerPopup({
  item,
  onFocus,
}: {
  item: MapItem;
  onFocus?: (item: MapItem) => void;
}) {
  const type = (item.type || "alert").toLowerCase();

  return (
    <Popup className="custom-dark-popup">
      <div className="min-w-[220px] max-w-[260px] p-0.5 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5 font-bold text-xs">
            {type === "sos" && <span className="text-red-400">🚨 SOS REQUEST</span>}
            {type === "alert" && <span className="text-amber-400">⚠️ DISASTER ALERT</span>}
            {type === "team" && <span className="text-blue-400">🚒 RESCUE TEAM</span>}
            {type === "unit" && <span className="text-emerald-400">🚑 RESPONSE UNIT</span>}
            {type === "district-risk" && <span className="text-cyan-400">🌐 FLOOD RISK</span>}
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
          <p className="mt-1 text-xs text-slate-400">
            📍 {item.location}
          </p>
        )}

        {/* SOS Details */}
        {type === "sos" && (
          <div className="mt-2 space-y-1 rounded-xl border border-red-500/20 bg-red-950/20 p-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">People:</span>
              <span className="font-bold text-red-300">👥 {item.people || 1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-semibold text-white">{item.status || "PENDING"}</span>
            </div>
            {item.message && (
              <p className="mt-1 border-t border-red-500/20 pt-1 text-[11px] text-slate-300 italic">
                "{item.message}"
              </p>
            )}
          </div>
        )}

        {/* Alert Details */}
        {type === "alert" && (
          <div className="mt-2 space-y-1 rounded-xl border border-slate-700 bg-slate-800/40 p-2 text-xs">
            {item.disaster_type && (
              <div className="flex justify-between">
                <span className="text-slate-400">Type:</span>
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
          <div className="mt-2 space-y-1 rounded-xl border border-slate-700 bg-slate-800/40 p-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Type:</span>
              <span className="font-semibold text-white">{item.team_type || item.unit_type || "Tactical"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-emerald-400">{item.status || "AVAILABLE"}</span>
            </div>
          </div>
        )}

        {/* District Risk Details */}
        {type === "district-risk" && (
          <div className="mt-2 space-y-1 rounded-xl border border-blue-500/20 bg-blue-950/20 p-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Flood Risk:</span>
              <span className="font-bold text-red-400">{item.probability ?? 0}%</span>
            </div>
          </div>
        )}

        {/* Coordinates */}
        <div className="mt-2.5 flex items-center justify-between border-t border-slate-700/60 pt-1.5 text-[10px] text-slate-500">
          <span>
            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </span>
          {onFocus && (
            <button
              type="button"
              onClick={() => onFocus(item)}
              className="rounded-lg bg-blue-600/30 px-2 py-0.5 font-semibold text-blue-300 transition hover:bg-blue-600 hover:text-white"
            >
              🎯 Focus
            </button>
          )}
        </div>

      </div>
    </Popup>
  );
}

// ============================================================
// MAIN DISASTER MAP
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
  const [filter, setFilter] = useState<"ALL" | "SOS" | "ALERTS" | "RESOURCES">("ALL");
  const [isPlayingSOS, setIsPlayingSOS] = useState(false);
  const [sosPlayIndex, setSosPlayIndex] = useState(0);
  const [triggerFit, setTriggerFit] = useState(0);
  const [focusedItem, setFocusedItem] = useState<MapItem | null>(null);

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

  // Auto-cycle through SOS requests when Play SOS is active
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
      }, 3500);
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
      
      {/* MAP TOOLBAR */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2 pointer-events-auto">
        
        {/* Filter Pills */}
        <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-900/95 p-1 shadow-lg backdrop-blur-md text-xs">
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
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
              filter === "SOS" ? "bg-red-600 text-white shadow" : "text-red-400 hover:bg-red-500/10"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-red-400"></span>
            SOS ({validSOS.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter("ALERTS")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
              filter === "ALERTS" ? "bg-amber-600 text-white shadow" : "text-amber-400 hover:bg-amber-500/10"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            Alerts ({validAlerts.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter("RESOURCES")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
              filter === "RESOURCES" ? "bg-emerald-600 text-white shadow" : "text-emerald-400 hover:bg-emerald-500/10"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Units ({validUnits.length + validTeams.length})
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
                  : "border-slate-700/80 bg-slate-900/95 text-slate-200 hover:border-red-500 hover:text-white"
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
            className="flex h-8 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/95 px-2.5 text-xs font-semibold text-slate-300 shadow-lg backdrop-blur-md transition hover:border-blue-500 hover:text-white"
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

        {/* 100% FREE BASE MAPS - NO API KEY REQUIRED */}
        <LayersControl position="bottomright">
          
          <LayersControl.BaseLayer checked name="🗺️ Street Map (OpenStreetMap)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🛰️ Satellite Imagery (Esri)">
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="⛰️ Topographic Map (Esri)">
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

        </LayersControl>

        {/* =====================================================
            DISTRICT RISK POLYGONS
        ===================================================== */}
        {filter === "ALL" &&
          validDistrictRisks.map((item, idx) => {
            const prob = item.probability ?? 0;
            const color =
              prob >= 70 ? "#ef4444" : prob >= 40 ? "#f97316" : "#3b82f6";
            return (
              <Circle
                key={`district-circle-${item.id || idx}`}
                center={[item.latitude, item.longitude]}
                radius={22000}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.12,
                  weight: 1.5,
                  dashArray: "4, 6",
                }}
              >
                <Tooltip direction="top" opacity={0.95}>
                  {item.district || "District"}: Flood Risk {prob}%
                </Tooltip>
                <SimpleMarkerPopup item={item} onFocus={setFocusedItem} />
              </Circle>
            );
          })}

        {/* =====================================================
            LAYER 3: RESPONSE TEAMS & UNITS (SIMPLE DOTS)
        ===================================================== */}
        {(filter === "ALL" || filter === "RESOURCES") &&
          [...validUnits, ...validTeams].map((item, idx) => {
            const isSelected = activeFocus?.id === item.id;
            return (
              <Marker
                key={`resource-${item.type}-${item.id || idx}`}
                position={[item.latitude, item.longitude]}
                icon={createSimpleResourceIcon(item.type, isSelected)}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                  {item.name || "Resource"} ({item.status || "AVAILABLE"})
                </Tooltip>
                <SimpleMarkerPopup item={item} onFocus={setFocusedItem} />
              </Marker>
            );
          })}

        {/* =====================================================
            LAYER 1: DISASTER & WEATHER ALERTS (SIMPLE DOTS)
        ===================================================== */}
        {(filter === "ALL" || filter === "ALERTS") &&
          validAlerts.map((item, idx) => {
            const isSelected = activeFocus?.id === item.id;
            return (
              <Marker
                key={`alert-${item.id || idx}`}
                position={[item.latitude, item.longitude]}
                icon={createSimpleAlertIcon(item.severity, isSelected)}
                zIndexOffset={100}
              >
                <Tooltip direction="top" offset={[0, -9]} opacity={0.95}>
                  ⚠️ {item.title || "Alert"} [{item.severity || "HIGH"}]
                </Tooltip>
                <SimpleMarkerPopup item={item} onFocus={setFocusedItem} />
              </Marker>
            );
          })}

        {/* =====================================================
            LAYER 2: LIVE SOS BEACONS (TOP PRIORITY LAYER - SIMPLE RADAR DOTS)
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
                icon={createSimpleSOSIcon(isSelected)}
                zIndexOffset={1000} // Keeps SOS on top layer
                eventHandlers={{
                  click: () => {
                    setFocusedItem(item);
                    if (onSelectSOS) onSelectSOS(item);
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -11]} opacity={0.95}>
                  🚨 SOS #{item.id} - {item.name} ({item.people || 1} people)
                </Tooltip>
                <SimpleMarkerPopup item={item} onFocus={setFocusedItem} />
              </Marker>
            );
          })}

      </MapContainer>
    </div>
  );
}