import { API_URL } from "../config/env";

/** Thin fetch wrapper: JSON in/out, throws on non-2xx, supports AbortSignal. */
export async function request(path, { method = "GET", json, body, signal } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    signal,
    headers: json ? { "Content-Type": "application/json" } : undefined,
    body: json ? JSON.stringify(json) : body,
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.status === 204 ? null : res.json();
}
