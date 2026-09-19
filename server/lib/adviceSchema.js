import { z } from "zod";

/**
 * The structured shape the language model must return, and the shape the UI
 * consumes.
 *
 * `facilities` is deliberately NOT part of this schema: real places come from a
 * maps database and are attached by the handler after the model has answered.
 * Keeping them out of the model's output is what stops it inventing addresses.
 */

export const ACTION_TYPES = [
  "reuse",
  "clean",
  "repair",
  "repurpose",
  "recycle",
  "special_disposal",
  "general_disposal",
];

export const SUITABILITY = ["recommended", "possible", "not_advised"];

export const adviceSchema = z.object({
  summary: z
    .string()
    .describe("One or two plain sentences on what this item is and the gist of what to do."),
  segregation: z.object({
    bin: z.string().describe("The bin or stream to place it in, in everyday words."),
    stream: z.string().describe("Short stream name, e.g. 'Dry recyclable', 'Hazardous'."),
    tips: z.array(z.string()).describe("2-4 short, practical sorting tips for THIS item."),
  }),
  actions: z
    .array(
      z.object({
        type: z.enum(ACTION_TYPES),
        title: z.string().describe("Short action name, e.g. 'Refill at home'."),
        detail: z.string().describe("One sentence on how to do it."),
        suitability: z.enum(SUITABILITY),
      })
    )
    .describe(
      "3-6 options across reuse, clean, repair, repurpose, recycle and disposal. " +
        "Mark ones that don't suit this item as not_advised rather than omitting them."
    ),
  preparation: z
    .array(z.string())
    .describe("Ordered steps to prepare the item before disposal or reuse."),
  // Must stay strictly required. Groq's json_schema mode rejects any schema
  // whose `required` list is not every key in `properties`, so `.optional()` or
  // `.default()` here fails the request outright before the model even runs.
  // Smaller models sometimes omit this key and fail validation; that is a model
  // capability limit, and the rules fallback covers it.
  safety: z
    .string()
    .describe("A safety warning if the item can cut, leak or harm. Empty string if none apply."),
  finalAction: z.object({
    type: z.enum(ACTION_TYPES),
    why: z.string().describe("One sentence on why this is the best option for this item."),
  }),
});

/** What the endpoint returns. Facilities and provenance are added server-side. */
export const adviceResponseShape = {
  status: "ok", // ok | low_confidence
  source: "ai", // ai | rules
  summary: "",
  segregation: { bin: "", stream: "", tips: [] },
  actions: [],
  preparation: [],
  safety: null,
  finalAction: { type: "recycle", why: "" },
  facilities: [],
};
