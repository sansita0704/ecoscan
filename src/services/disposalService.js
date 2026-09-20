import { USE_MOCK } from "../config/env";
import { request } from "./http";
import { mockToken, wait } from "./mockData";

/**
 * POST /api/v1/disposal-tokens  { class_name, bin }  ->  { token: "ECO-..." }
 * @returns {Promise<string>}
 */
export async function createDisposalToken(detection, { signal } = {}) {
  if (USE_MOCK) {
    await wait(400, signal);
    return mockToken(detection);
  }
  const data = await request("/api/v1/disposal-tokens", {
    method: "POST",
    json: {
      class_name: detection.rawClass ?? detection.className,
      bin: detection.bin ?? detection.category,
    },
    signal,
  });
  return data.token;
}
