import { redis, ROSTER_KEY } from "./redis.js";
import { getBundledData } from "./roster.js";

// Live roster = the one published via the admin page (stored in Redis),
// falling back to the CSV bundled in the repo.
export async function getLiveData() {
  if (redis) {
    try {
      const stored = await redis.get(ROSTER_KEY);
      if (stored) {
        const o = typeof stored === "string" ? JSON.parse(stored) : stored;
        if (o && Array.isArray(o.people) && o.people.length) return o;
      }
    } catch (e) { /* fall through to bundled */ }
  }
  return getBundledData();
}
