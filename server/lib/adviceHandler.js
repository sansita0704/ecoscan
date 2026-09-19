import { createGroq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { adviceSchema } from "./adviceSchema.js";
import { buildPrompt, SYSTEM_PROMPT } from "./buildPrompt.js";
import { findFacilities } from "./facilities.js";
import { rulesAdvice } from "./rulesFallback.js";

/**
 * POST /api/ai/advice
 *
 * ML says what it is -> a language model says what to do with it -> a maps
 * database says where to take it. The three are kept strictly separate: the
 * language model is handed only real detection output plus the rule table, and
 * never produces facilities.
 *
 * The API key is read from the server environment and never leaves this process.
 */

// App policy, not a model property: below this we ask for a rescan rather than
// dressing up a shaky classification in confident-sounding advice. The model's
// own floor (ECOSCAN_CONF, default 0.35) is separate and lower.
export const ADVICE_MIN_CONFIDENCE = Number(process.env.ADVICE_MIN_CONFIDENCE ?? 0.5);

// Groq. Structured output uses the provider's strict json_schema mode, so the
// model must reliably emit every required key. Measured on this schema:
//   openai/gpt-oss-120b  ~3s, all 6 action types        <- default
//   qwen/qwen3.8-27b     ~7s, fewer action types        <- workable alternative
//   openai/gpt-oss-20b   fails validation (omits `safety`)
const MODEL_ID = process.env.ADVICE_MODEL ?? "openai/gpt-oss-120b";

const HAZARD_HINT = (category = "") => String(category).toLowerCase().includes("hazard");

function badRequest(message) {
  return { status: 400, body: { error: message } };
}

/** Normalise and validate the client payload down to fields the ML really has. */
function parseInput(raw) {
  if (!raw || typeof raw !== "object") return { error: "Expected a JSON body" };
  const d = raw.detection;
  if (!d || typeof d !== "object") return { error: "Missing `detection`" };
  if (typeof d.className !== "string" || !d.className) return { error: "Missing `detection.className`" };
  const confidence = Number(d.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    return { error: "`detection.confidence` must be between 0 and 1" };
  }

  const loc = raw.location ?? {};
  const lat = Number(loc.lat);
  const lon = Number(loc.lon);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon)
    && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

  return {
    detection: {
      className: String(d.className),
      label: String(d.label ?? d.className),
      confidence,
      category: String(d.category ?? ""),
      materialGrade: String(d.materialGrade ?? "unknown"),
      weightG: Number.isFinite(Number(d.weightG)) ? Number(d.weightG) : null,
      contamination: d.contamination ?? null,
      steps: Array.isArray(d.steps) ? d.steps.filter((s) => typeof s === "string") : [],
    },
    material: typeof raw.material === "string" ? raw.material : null,
    location: {
      label: typeof loc.label === "string" ? loc.label : null,
      lat: hasCoords ? lat : null,
      lon: hasCoords ? lon : null,
    },
  };
}

async function askModel(input, signal) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null; // unconfigured is a normal state, not an error

  const groq = createGroq({ apiKey });
  const { object } = await generateObject({
    model: groq(MODEL_ID),
    schema: adviceSchema,
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(input),
    temperature: 0.3,
    abortSignal: signal,
  });
  return object;
}

/**
 * @param {unknown} rawBody parsed JSON body
 * @param {{signal?: AbortSignal}} [opts]
 * @returns {Promise<{status:number, body:object}>}
 */
export async function handleAdvice(rawBody, { signal } = {}) {
  const parsed = parseInput(rawBody);
  if (parsed.error) return badRequest(parsed.error);

  const { detection, material, location } = parsed;

  // Gate before spending a model call: a shaky class makes every downstream
  // sentence wrong, so ask for a better look instead.
  if (detection.confidence < ADVICE_MIN_CONFIDENCE) {
    return {
      status: 200,
      body: {
        status: "low_confidence",
        source: "none",
        confidence: detection.confidence,
        threshold: ADVICE_MIN_CONFIDENCE,
        message:
          "The scan isn't confident enough to advise on. Move closer, steady the item and make sure it's well lit, then scan again.",
        facilities: [],
      },
    };
  }

  const hazardous = HAZARD_HINT(detection.category);

  // Advice and facilities are independent; run them together. Facilities never
  // fail the request - a missing maps result just yields an empty list.
  const [adviceResult, facilityResult] = await Promise.all([
    askModel({ detection, material, location }, signal)
      .then((object) => (object ? { object, source: "ai" } : { object: null, source: "rules" }))
      .catch((err) => {
        console.error("[advice] model failed, falling back to rules:", err?.message ?? err);
        return { object: null, source: "rules", failed: true };
      }),
    location.lat != null
      ? findFacilities({ lat: location.lat, lon: location.lon }, { material, hazardous, signal })
          .catch(() => ({ facilities: [], source: "OpenStreetMap", error: "lookup_failed" }))
      : Promise.resolve({ facilities: [], source: "OpenStreetMap", error: "no_location" }),
  ]);

  const base = adviceResult.object
    ? { ...adviceResult.object, source: "ai" }
    : rulesAdvice({ detection, material });

  return {
    status: 200,
    body: {
      status: "ok",
      source: base.source,
      // Present only when the model path was tried and failed, so the UI can say so.
      degraded: adviceResult.failed === true,
      model: base.source === "ai" ? MODEL_ID : null,
      confidence: detection.confidence,
      summary: base.summary,
      segregation: base.segregation,
      actions: base.actions,
      preparation: base.preparation,
      // The schema uses "" for "no warning"; the UI contract uses null.
      safety: base.safety ? base.safety : null,
      finalAction: base.finalAction,
      facilities: facilityResult.facilities,
      facilitySource: facilityResult.source,
      facilityNote: facilityResult.error ?? null,
      searchRadiusKm: facilityResult.searchRadiusKm ?? null,
    },
  };
}
