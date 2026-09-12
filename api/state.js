import { redis, SERVED_KEY } from "../lib/redis.js";
import { getRoster } from "../lib/roster.js";

export default async function handler(req, res) {
  let roster = [];
  try {
    roster = getRoster();
  } catch (e) {
    return res.status(500).json({
      error: "Could not read data/roster.csv. Make sure the file exists.",
      roster: [],
      served: {},
    });
  }

  if (!redis) {
    // Deployed but no database connected yet — tell the user exactly what to do.
    return res.status(200).json({
      roster,
      served: {},
      configured: false,
      message:
        "Storage not connected. In Vercel, open Storage, create an Upstash Redis database, and connect it to this project. Then redeploy.",
    });
  }

  try {
    const served = (await redis.hgetall(SERVED_KEY)) || {};
    return res.status(200).json({ roster, served, configured: true, ts: Date.now() });
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Storage read failed.", roster, served: {} });
  }
}
