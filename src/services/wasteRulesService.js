import { USE_MOCK } from "../config/env";
import { request } from "./http";
import { MOCK_WASTE_RULES, wait } from "./mockData";

/**
 * GET /api/v1/waste-rules -> { classes: [...], rules: { class_name: {...} } }
 *
 * The configured disposal rules, so the Waste Guide shows what is actually in
 * force rather than a duplicated frontend copy.
 *
 * @returns {Promise<{classes: string[], rules: Record<string, object>}>}
 */
export async function getWasteRules({ signal } = {}) {
  if (USE_MOCK) {
    await wait(250, signal);
    return MOCK_WASTE_RULES;
  }
  const raw = await request("/api/v1/waste-rules", { signal });
  return { classes: raw.classes ?? [], rules: raw.rules ?? {} };
}
