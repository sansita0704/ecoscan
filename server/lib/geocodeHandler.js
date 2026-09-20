/**
 * POST /api/facilities/geocode  { query: string } -> { results: [{label, lat, lon}] }
 *
 * Turns a typed place name into coordinates via Nominatim (OpenStreetMap's
 * free geocoder) - same data family as facilities.js, no API key, nothing
 * fabricated. Lets someone search any location by name instead of only
 * being able to use their live GPS position.
 *
 * Nominatim's usage policy caps this at ~1 request/second and requires a
 * real identifying User-Agent, which is fine for an on-demand search
 * triggered by a person typing, never a background loop.
 */

const ENDPOINT = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = process.env.OVERPASS_USER_AGENT ?? "EcoScanAI/1.0 (waste sorting assistant)";
const REQUEST_TIMEOUT_MS = 8000;
const MAX_RESULTS = 5;

function badRequest(message) {
  return { status: 400, body: { error: message } };
}

async function attempt(url, signal) {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const composite = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: composite,
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return res.json();
}

export async function handleGeocode(rawBody, { signal } = {}) {
  if (!rawBody || typeof rawBody !== "object") return badRequest("Expected a JSON body");

  const query = typeof rawBody.query === "string" ? rawBody.query.trim() : "";
  if (!query) return badRequest("`query` is required");
  if (query.length > 200) return badRequest("`query` is too long");

  const url = new URL(ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(MAX_RESULTS));
  url.searchParams.set("addressdetails", "0");

  // One retry on top of the single endpoint: unlike facilities.js there's no
  // second mirror to fall back to here, and a single stalled connection
  // (cold DNS/TLS, a dropped packet) otherwise has no second chance at all.
  let data;
  let lastErr;
  for (let i = 0; i < 2; i += 1) {
    if (signal?.aborted) break;
    try {
      data = await attempt(url, signal);
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
    }
  }

  if (lastErr) {
    console.error("[geocode] lookup failed:", lastErr?.message ?? lastErr);
    // Same policy as facilities.js: a failed free-service call is a normal
    // outcome, not a 500 - the UI says so and stays usable.
    return { status: 200, body: { results: [], error: "lookup_failed" } };
  }

  const results = (Array.isArray(data) ? data : [])
    .map((r) => ({
      label: r.display_name,
      lat: Number(r.lat),
      lon: Number(r.lon),
    }))
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon));

  return { status: 200, body: { results } };
}
