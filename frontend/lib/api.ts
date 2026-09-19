import { API_BASE_URL } from "./config";

export { API_BASE_URL };

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      text ||
        `API request failed: ${response.status}`
    );
  }

  return response.json();
}

/* =========================================================
   HEALTH
========================================================= */

export function getHealth() {
  return apiFetch("/health");
}

/* =========================================================
   LIVE FLOOD PREDICTIONS
========================================================= */

export function getLivePredictions() {
  return apiFetch("/live-predictions");
}

export function getHighRiskPredictions() {
  return apiFetch("/live-predictions/high");
}

export function getMediumRiskPredictions() {
  return apiFetch("/live-predictions/medium");
}

export function getLowRiskPredictions() {
  return apiFetch("/live-predictions/low");
}

export function getPredictionSummary() {
  return apiFetch("/live-predictions/summary");
}

/* =========================================================
   DISASTERS
========================================================= */

export function getDisasters() {
  return apiFetch("/disasters");
}

export function createDisaster(data: {
  disaster_type: string;
  location: string;
  severity: string;
  latitude: number;
  longitude: number;
  description: string;
}) {
  return apiFetch("/disasters", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* =========================================================
   ALERTS
========================================================= */

export function getAlerts() {
  return apiFetch("/alerts");
}

export function getAlertHistory() {
  return apiFetch("/alerts/history");
}

export function getAlert(alertId: number) {
  return apiFetch(`/alerts/${alertId}`);
}

export function resolveAlert(alertId: number) {
  return apiFetch(
    `/alerts/${alertId}/resolve`,
    {
      method: "PATCH",
    }
  );
}

/* =========================================================
   SOS
========================================================= */

export function getSOSRequests() {
  return apiFetch("/sos");
}

export function createSOS(data: {
  name: string;
  phone?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  emergency?: string;
  description?: string;
  people?: number;
  priority?: string;
}) {
  return apiFetch("/sos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* =========================================================
   RESPONSE UNITS
========================================================= */

export function getResponseUnits() {
  return apiFetch("/response-units");
}

/* =========================================================
   RESPONSE TEAMS
========================================================= */

export function getResponseTeams() {
  return apiFetch("/response-teams");
}

/* =========================================================
   RESCUE TEAMS
========================================================= */

export function getRescueTeams() {
  return apiFetch("/rescue-teams");
}

/* =========================================================
   VOLUNTEERS
========================================================= */

export function getVolunteers() {
  return apiFetch("/volunteers");
}

/* =========================================================
   REPORTS
========================================================= */

export function getReports() {
  return apiFetch("/reports");
}

/* =========================================================
   LOCATION
========================================================= */

export async function reverseGeocode(
  latitude: number,
  longitude: number
) {
  return apiFetch(
    `/location/reverse?latitude=${latitude}&longitude=${longitude}`
  );
}