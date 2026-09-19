"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
  LayersControl,
} from "react-leaflet";

import { useEffect } from "react";

import "leaflet/dist/leaflet.css";

type MapItem = {
  id: number | string;
  latitude: number;
  longitude: number;

  type?: string;
  severity?: string;

  title?: string;
  location?: string;
  message?: string;

  status?: string;
  people?: number;
  name?: string;

  unit_type?: string;
  team_type?: string;
  members?: number;
  disaster_type?: string;
  district?: string;
  state?: string;
  probability?: number;
  rainfall_probability?: number;
  weather_probability?: number;
};

type Props = {
  disasters?: MapItem[];
  sosRequests?: MapItem[];
  responseUnits?: MapItem[];
  responseTeams?: MapItem[];
  districtAlerts?: MapItem[];
};

function MapResizeFix() {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [map]);

  return null;
}

function MapAutoFit({
  items,
}: {
  items: MapItem[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!items.length) return;

    const valid = items.filter(
      (item) =>
        Number.isFinite(item.latitude) &&
        Number.isFinite(item.longitude)
    );

    if (!valid.length) return;

    const bounds = valid.map((item) => [
      item.latitude,
      item.longitude,
    ]) as [number, number][];

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 12,
    });
  }, [items, map]);

  return null;
}

function getColor(item: MapItem) {
  const type =
    item.type?.toLowerCase();

  if (type === "sos") {
    return "#ef4444";
  }

  if (type === "unit") {
    return "#22c55e";
  }

  if (type === "team") {
    return "#3b82f6";
  }

  switch (
    item.severity?.toUpperCase()
  ) {
    case "CRITICAL":
      return "#dc2626";

    case "HIGH":
      return "#f97316";

    case "MEDIUM":
      return "#eab308";

    case "LOW":
      return "#22c55e";

    default:
      return "#f97316";
  }
}

function getRadius(item: MapItem) {
  switch (
    item.type?.toLowerCase()
  ) {
    case "sos":
      return 11;

    case "alert":
      return 9;

    case "team":
      return 7;

    case "unit":
      return 7;

    default:
      return 8;
  }
}

function MarkerPopup({
  item,
}: {
  item: MapItem;
}) {
  const type =
    item.type?.toLowerCase();

  return (
    <Popup>
      <div className="min-w-[210px] text-sm">
        <div className="mb-2 font-bold">
          {item.title ||
            item.name ||
            "Location"}
        </div>

        {item.location && (
          <div className="mb-1">
            📍 {item.location}
          </div>
        )}

        {type === "sos" && (
          <>
            <div>
              🚨 Priority:{" "}
              <b>
                {item.severity ||
                  "HIGH"}
              </b>
            </div>

            <div>
              👥 People:{" "}
              <b>
                {item.people || 1}
              </b>
            </div>

            <div>
              Status:{" "}
              <b>
                {item.status}
              </b>
            </div>

            {item.message && (
              <div className="mt-1">
                {item.message}
              </div>
            )}
          </>
        )}

        {type === "alert" && (
          <>
            <div>
              ⚠️ Severity:{" "}
              <b>
                {item.severity}
              </b>
            </div>

            {item.disaster_type && (
              <div>
                Type:{" "}
                <b>
                  {item.disaster_type}
                </b>
              </div>
            )}

            {item.message && (
              <div className="mt-1">
                {item.message}
              </div>
            )}
          </>
        )}

        {type === "district-risk" && (
          <>
            <div>
              Flood probability: <b>{item.probability ?? 0}%</b>
            </div>
            <div>
              Rainfall signal: <b>{item.rainfall_probability ?? 0}%</b>
            </div>
            <div>
              Weather signal: <b>{item.weather_probability ?? 0}%</b>
            </div>
          </>
        )}

        {type === "unit" && (
          <>
            <div>
              🚑 Type:{" "}
              <b>
                {item.unit_type}
              </b>
            </div>

            <div>
              Status:{" "}
              <b>
                {item.status}
              </b>
            </div>
          </>
        )}

        {type === "team" && (
          <>
            <div>
              🚒 Type:{" "}
              <b>
                {item.team_type}
              </b>
            </div>

            <div>
              👥 Members:{" "}
              <b>
                {item.members || 1}
              </b>
            </div>

            <div>
              Status:{" "}
              <b>
                {item.status}
              </b>
            </div>
          </>
        )}

        <div className="mt-2 text-[10px] text-gray-500">
          {item.latitude.toFixed(5)},{" "}
          {item.longitude.toFixed(5)}
        </div>
      </div>
    </Popup>
  );
}

export default function DisasterMap({
  disasters = [],
  sosRequests = [],
  responseUnits = [],
  responseTeams = [],
  districtAlerts = [],
}: Props) {
  const allItems = [
    ...disasters,
    ...sosRequests,
    ...responseUnits,
    ...responseTeams,
    ...districtAlerts,
  ].filter(
    (item) =>
      item &&
      Number.isFinite(item.latitude) &&
      Number.isFinite(item.longitude)
  );

  return (
    <MapContainer
      center={[28.6139, 77.209]}
      zoom={5}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Street map">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite imagery">
          <TileLayer
            attribution="Tiles &copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <MapResizeFix />

      <MapAutoFit
        items={allItems}
      />

      {allItems.map(
        (item, index) => (
          <CircleMarker
            key={`${item.type || "marker"}-${item.id}-${index}`}
            center={[
              item.latitude,
              item.longitude,
            ]}
            radius={getRadius(item)}
            pathOptions={{
              color: getColor(item),
              fillColor: getColor(item),
              fillOpacity: 0.75,
              weight:
                item.type === "sos"
                  ? 3
                  : 2,
            }}
          >
            <MarkerPopup
              item={item}
            />
          </CircleMarker>
        )
      )}
    </MapContainer>
  );
}