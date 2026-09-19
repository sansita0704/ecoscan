import { USE_MOCK } from "../config/env";
import { request } from "./http";
import { MOCK_LEADERBOARD, wait } from "./mockData";

/**
 * GET /api/v1/leaderboard -> [{ id, name, points, streak_days, is_you }]
 *
 * Community standings. The backend serves a fixed sample list, so the UI labels
 * it as such. Your own figures come from the local scan log instead
 * (see services/scanHistory.js), which is why there's no ledger fetch here.
 *
 * @returns {Promise<import("../types/contracts").LeaderboardEntry[]>}
 */
export async function getLeaderboard({ signal } = {}) {
  if (USE_MOCK) {
    await wait(300, signal);
    return MOCK_LEADERBOARD;
  }
  const raw = await request("/api/v1/leaderboard", { signal });
  return raw.map((r) => ({
    id: r.id,
    name: r.name,
    points: r.points,
    streakDays: r.streak_days,
    isYou: r.is_you,
  }));
}
