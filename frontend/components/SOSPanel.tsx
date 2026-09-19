"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/config";

export interface SOSRequest {
  id: number;
  name: string;
  phone: string | null;
  location: string;
  people: number;
  emergency: string;
  priority: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  status: string;
  created_at: string | null;
}

interface SOSPanelProps {
  sosRequests: SOSRequest[];
  onSOSCreated: () => Promise<void> | void;
}

export default function SOSPanel({
  sosRequests,
  onSOSCreated,
}: SOSPanelProps) {
  const [sosOpen, setSosOpen] = useState(false);

  const [sosSending, setSosSending] =
    useState(false);

  const [sosMessage, setSosMessage] =
    useState("");

  const [selectedSOS, setSelectedSOS] =
    useState<SOSRequest | null>(null);

  const [statusUpdating, setStatusUpdating] =
    useState<number | null>(null);

  /* ============================================================
     ONE TAP SOS
  ============================================================ */

  const activateOneTapSOS = async () => {
    try {
      setSosSending(true);
      setSosMessage("");

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
                maximumAge: 0,
              }
            );
          }
        );

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;

      const response = await fetch(
        `${API_BASE_URL}/sos/one-tap`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Emergency User",
            location: "Current GPS Location",
            people: 1,
            latitude,
            longitude,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "SOS activation request failed."
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to activate SOS."
        );
      }

      setSosMessage(
        `🚨 SOS #${result.sos_id} activated successfully. Your GPS location has been sent to the emergency response system.`
      );

      await onSOSCreated();

      setSosOpen(true);

      setTimeout(() => {
        setSosMessage("");
      }, 7000);
    } catch (error) {
      console.error(
        "One-Tap SOS error:",
        error
      );

      if (
        error instanceof GeolocationPositionError
      ) {
        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          setSosMessage(
            "❌ Location permission was denied. Please allow location access and try again."
          );
        } else if (
          error.code ===
          error.TIMEOUT
        ) {
          setSosMessage(
            "❌ Unable to get your GPS location in time. Please try again."
          );
        } else {
          setSosMessage(
            "❌ Unable to determine your current location."
          );
        }
      } else {
        setSosMessage(
          "❌ Unable to activate SOS. Please check that the backend server is running."
        );
      }
    } finally {
      setSosSending(false);
    }
  };

  /* ============================================================
     UPDATE SOS STATUS
  ============================================================ */

  const updateSOSStatus = async (
    sosId: number,
    status: string
  ) => {
    try {
      setStatusUpdating(sosId);

      const response = await fetch(
        `${API_BASE_URL}/sos/${sosId}/status?status=${encodeURIComponent(status)}`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error(
          "SOS status update failed."
        );
      }

      const result =
        await response.json();

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to update SOS status."
        );
      }

      setSelectedSOS(null);

      await onSOSCreated();
    } catch (error) {
      console.error(
        "SOS status update error:",
        error
      );

      setSosMessage(
        "❌ Unable to update SOS status."
      );
    } finally {
      setStatusUpdating(null);
    }
  };

  /* ============================================================
     HELPERS
  ============================================================ */

  const getPriorityClass = (
    priority: string
  ) => {
    const value =
      priority?.toUpperCase();

    if (value === "CRITICAL") {
      return "border-red-500/40 bg-red-500/10 text-red-400";
    }

    if (value === "HIGH") {
      return "border-orange-500/40 bg-orange-500/10 text-orange-400";
    }

    if (value === "MEDIUM") {
      return "border-yellow-500/40 bg-yellow-500/10 text-yellow-400";
    }

    return "border-green-500/40 bg-green-500/10 text-green-400";
  };

  const getStatusClass = (
    status: string
  ) => {
    const value =
      status?.toUpperCase();

    if (value === "PENDING") {
      return "bg-red-500/10 text-red-400";
    }

    if (value === "ASSIGNED") {
      return "bg-blue-500/10 text-blue-400";
    }

    if (value === "IN_PROGRESS") {
      return "bg-orange-500/10 text-orange-400";
    }

    if (value === "RESOLVED") {
      return "bg-green-500/10 text-green-400";
    }

    if (value === "CANCELLED") {
      return "bg-slate-700 text-slate-400";
    }

    return "bg-slate-800 text-slate-300";
  };

  const formatDate = (
    dateString: string | null
  ) => {
    if (!dateString) {
      return "Unknown";
    }

    const date =
      new Date(dateString);

    if (
      Number.isNaN(date.getTime())
    ) {
      return dateString;
    }

    return date.toLocaleString(
      "en-IN",
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    );
  };

  const activeSOSCount =
    sosRequests.filter(
      (sos) =>
        !["RESOLVED", "CANCELLED"].includes(
          sos.status?.toUpperCase()
        )
    ).length;

  const criticalSOSCount =
    sosRequests.filter(
      (sos) =>
        sos.priority?.toUpperCase() ===
          "CRITICAL" &&
        !["RESOLVED", "CANCELLED"].includes(
          sos.status?.toUpperCase()
        )
    ).length;

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <>
      {/* ========================================================
          SOS REQUESTS
      ======================================================== */}

      <div className="mt-8 overflow-hidden rounded-2xl border border-red-500/20 bg-slate-900">

        <button
          onClick={() =>
            setSosOpen(!sosOpen)
          }
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-slate-800/60"
        >
          <div>

            <div className="flex flex-wrap items-center gap-3">

              <h2 className="text-xl font-bold">
                🚨 Emergency SOS Requests
              </h2>

              <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
                {sosRequests.length} Total
              </span>

              {activeSOSCount > 0 && (
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
                  {activeSOSCount} Active
                </span>
              )}

              {criticalSOSCount > 0 && (
                <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
                  {criticalSOSCount} Critical
                </span>
              )}

            </div>

            <p className="mt-1 text-sm text-slate-400">
              Live emergency requests received by
              the disaster response system
            </p>

          </div>

          <span className="text-2xl text-slate-400">
            {sosOpen ? "▲" : "▼"}
          </span>

        </button>

        {sosOpen && (
          <div className="border-t border-slate-800">

            {sosRequests.length === 0 ? (
              <div className="px-6 py-10 text-center">

                <div className="text-4xl">
                  ✓
                </div>

                <p className="mt-3 font-semibold text-green-400">
                  No SOS requests found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Emergency requests will appear
                  here automatically.
                </p>

              </div>
            ) : (
              <div className="max-h-[650px] overflow-y-auto divide-y divide-slate-800">

                {sosRequests.map((sos) => {

                  const status =
                    sos.status?.toUpperCase();

                  const isResolved =
                    status ===
                      "RESOLVED" ||
                    status ===
                      "CANCELLED";

                  return (
                    <div
                      key={sos.id}
                      className={`px-6 py-5 transition hover:bg-slate-800/40 ${
                        isResolved
                          ? "opacity-60"
                          : ""
                      }`}
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        {/* LEFT */}

                        <div className="flex min-w-0 items-start gap-4">

                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                              sos.priority?.toUpperCase() ===
                              "CRITICAL"
                                ? "bg-red-500/10"
                                : "bg-orange-500/10"
                            }`}
                          >
                            🚨
                          </div>

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="font-bold">
                                {sos.name}
                              </h3>

                              <span
                                className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${getStatusClass(
                                  sos.status
                                )}`}
                              >
                                {sos.status}
                              </span>

                            </div>

                            <p className="mt-2 text-sm text-slate-300">
                              📍 {sos.location}
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                              👥 {sos.people}{" "}
                              {sos.people === 1
                                ? "person"
                                : "people"}{" "}
                              •{" "}
                              {sos.emergency}
                            </p>

                            {sos.description && (
                              <p className="mt-2 text-sm text-slate-500">
                                {sos.description}
                              </p>
                            )}

                            {sos.phone && (
                              <p className="mt-2 text-xs text-slate-500">
                                📞 {sos.phone}
                              </p>
                            )}

                            {sos.latitude !== null &&
                              sos.longitude !== null && (
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

                            <p className="mt-2 text-xs text-slate-600">
                              Created:{" "}
                              {formatDate(
                                sos.created_at
                              )}
                            </p>

                          </div>

                        </div>

                        {/* RIGHT */}

                        <div className="flex flex-col gap-3 lg:items-end">

                          <span
                            className={`w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase ${getPriorityClass(
                              sos.priority
                            )}`}
                          >
                            {sos.priority}
                          </span>

                          <div className="flex flex-wrap gap-2">

                            <button
                              onClick={() =>
                                setSelectedSOS(
                                  sos
                                )
                              }
                              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
                            >
                              View Details
                            </button>

                            {!isResolved &&
                              status !==
                                "IN_PROGRESS" && (
                                <button
                                  disabled={
                                    statusUpdating ===
                                    sos.id
                                  }
                                  onClick={() =>
                                    updateSOSStatus(
                                      sos.id,
                                      status ===
                                        "PENDING"
                                        ? "ASSIGNED"
                                        : "IN_PROGRESS"
                                    )
                                  }
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold transition hover:bg-blue-500 disabled:opacity-50"
                                >
                                  {statusUpdating ===
                                  sos.id
                                    ? "Updating..."
                                    : status ===
                                      "PENDING"
                                    ? "Assign"
                                    : "Start Response"}
                                </button>
                              )}

                            {!isResolved &&
                              status ===
                                "IN_PROGRESS" && (
                                <button
                                  disabled={
                                    statusUpdating ===
                                    sos.id
                                  }
                                  onClick={() =>
                                    updateSOSStatus(
                                      sos.id,
                                      "RESOLVED"
                                    )
                                  }
                                  className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold transition hover:bg-green-500 disabled:opacity-50"
                                >
                                  {statusUpdating ===
                                  sos.id
                                    ? "Updating..."
                                    : "Resolve"}
                                </button>
                              )}

                          </div>

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================================
          ONE TAP SOS
      ======================================================== */}

      <div className="mt-8 rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/40 to-slate-900 p-6">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <p className="text-sm font-semibold uppercase tracking-wider text-red-400">
              Emergency Response
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              One-Tap Emergency SOS
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Send your current GPS location directly
              to the disaster response system. The
              request will automatically receive
              CRITICAL priority.
            </p>

          </div>

          <button
            onClick={activateOneTapSOS}
            disabled={sosSending}
            className="rounded-2xl bg-red-600 px-8 py-4 text-lg font-bold shadow-lg transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sosSending
              ? "📡 Getting Location..."
              : "🚨 SEND SOS"}
          </button>

        </div>

        {sosMessage && (
          <div
            className={`mt-5 rounded-xl border p-4 text-sm ${
              sosMessage.startsWith("🚨")
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {sosMessage}
          </div>
        )}

      </div>

      {/* ========================================================
          SOS DETAILS MODAL
      ======================================================== */}

      {selectedSOS && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedSOS(null)
          }
        >

          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                  Emergency Request
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  SOS #{selectedSOS.id}
                </h2>

              </div>

              <button
                onClick={() =>
                  setSelectedSOS(null)
                }
                className="rounded-lg bg-slate-800 px-3 py-2 text-slate-400 hover:text-white"
              >
                ✕
              </button>

            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-xs text-slate-500">
                  Name
                </p>
                <p className="mt-1 font-semibold">
                  {selectedSOS.name}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-xs text-slate-500">
                  Phone
                </p>
                <p className="mt-1 font-semibold">
                  {selectedSOS.phone ||
                    "Not provided"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-xs text-slate-500">
                  People
                </p>
                <p className="mt-1 font-semibold">
                  {selectedSOS.people}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-xs text-slate-500">
                  Emergency
                </p>
                <p className="mt-1 font-semibold">
                  {selectedSOS.emergency}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-xs text-slate-500">
                  Priority
                </p>
                <p
                  className={`mt-1 font-bold ${getPriorityClass(
                    selectedSOS.priority
                  )
                    .replace(
                      "border",
                      ""
                    )
                    .replace(
                      "bg-red-500/10",
                      ""
                    )
                    .replace(
                      "bg-orange-500/10",
                      ""
                    )
                    .replace(
                      "bg-yellow-500/10",
                      ""
                    )
                    .replace(
                      "bg-green-500/10",
                      ""
                    )}`}
                >
                  {selectedSOS.priority}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-xs text-slate-500">
                  Status
                </p>
                <p className="mt-1 font-bold">
                  {selectedSOS.status}
                </p>
              </div>

            </div>

            <div className="mt-4 rounded-xl bg-slate-950 p-4">

              <p className="text-xs text-slate-500">
                Location
              </p>

              <p className="mt-1">
                {selectedSOS.location}
              </p>

              {selectedSOS.latitude !==
                null &&
                selectedSOS.longitude !==
                  null && (
                  <p className="mt-2 text-xs text-slate-500">
                    GPS:{" "}
                    {selectedSOS.latitude.toFixed(
                      6
                    )}
                    ,{" "}
                    {selectedSOS.longitude.toFixed(
                      6
                    )}
                  </p>
                )}

            </div>

            {selectedSOS.description && (
              <div className="mt-4 rounded-xl bg-slate-950 p-4">

                <p className="text-xs text-slate-500">
                  Description
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  {selectedSOS.description}
                </p>

              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">

              {selectedSOS.status ===
                "PENDING" && (
                <button
                  disabled={
                    statusUpdating ===
                    selectedSOS.id
                  }
                  onClick={() =>
                    updateSOSStatus(
                      selectedSOS.id,
                      "ASSIGNED"
                    )
                  }
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
                >
                  Assign SOS
                </button>
              )}

              {selectedSOS.status ===
                "ASSIGNED" && (
                <button
                  disabled={
                    statusUpdating ===
                    selectedSOS.id
                  }
                  onClick={() =>
                    updateSOSStatus(
                      selectedSOS.id,
                      "IN_PROGRESS"
                    )
                  }
                  className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold hover:bg-orange-500 disabled:opacity-50"
                >
                  Start Response
                </button>
              )}

              {selectedSOS.status ===
                "IN_PROGRESS" && (
                <button
                  disabled={
                    statusUpdating ===
                    selectedSOS.id
                  }
                  onClick={() =>
                    updateSOSStatus(
                      selectedSOS.id,
                      "RESOLVED"
                    )
                  }
                  className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold hover:bg-green-500 disabled:opacity-50"
                >
                  Mark Resolved
                </button>
              )}

              {![
                "RESOLVED",
                "CANCELLED",
              ].includes(
                selectedSOS.status
              ) && (
                <button
                  disabled={
                    statusUpdating ===
                    selectedSOS.id
                  }
                  onClick={() =>
                    updateSOSStatus(
                      selectedSOS.id,
                      "CANCELLED"
                    )
                  }
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-400 hover:border-red-500 hover:text-red-400 disabled:opacity-50"
                >
                  Cancel SOS
                </button>
              )}

            </div>

          </div>

        </div>
      )}
    </>
  );
}