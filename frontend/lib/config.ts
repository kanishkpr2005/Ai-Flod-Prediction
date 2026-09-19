const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (
  configuredApiUrl ||
  (typeof window !== "undefined" ? "/api/backend" : "http://127.0.0.1:8000")
).replace(/\/$/, "");