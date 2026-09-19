"use client";

import dynamic from "next/dynamic";

const DisasterMap = dynamic(
  () => import("@/components/DisasterMap"),
  { ssr: false }
);

const markers = [
  {
    id: 1,
    latitude: 28.6139,
    longitude: 77.209,
    type: "alert",
    severity: "HIGH",
    title: "Northern India risk zone",
    location: "Delhi region",
  },
  {
    id: 2,
    latitude: 22.5726,
    longitude: 88.3639,
    type: "alert",
    severity: "CRITICAL",
    title: "Eastern India risk zone",
    location: "Kolkata region",
  },
  {
    id: 3,
    latitude: 19.076,
    longitude: 72.8777,
    type: "alert",
    severity: "MEDIUM",
    title: "Western India risk zone",
    location: "Mumbai region",
  },
];

export default function LandingMap() {
  return (
    <div className="h-full w-full">
      <DisasterMap disasters={markers} />
    </div>
  );
}
