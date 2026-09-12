import { redis, SERVED_KEY } from "../lib/redis.js";
import { getLiveData } from "../lib/data.js";

export default async function handler(req, res) {
  let data;
  try {
    data = await getLiveData();
  } catch (e) {
    return res.status(500).json({ error: "Could not load roster.", sessions: [], people: [], served: {} });
  }

  // Slim payload the UI needs.
  const people = data.people.map((p) => ({
    id: p.id, name: p.name, email: p.email, mobile: p.mobile, at: p.at, q: p.q,
  }));
  const out = { sessions: data.sessions, people };

  if (!redis) {
    return res.status(200).json({
      ...out, served: {}, configured: false,
      message: "Storage not connected. In Vercel: Storage \u2192 create Upstash Redis \u2192 Connect to this project, then redeploy.",
    });
  }
  try {
    const served = (await redis.hgetall(SERVED_KEY)) || {};
    return res.status(200).json({ ...out, served, configured: true, ts: Date.now() });
  } catch (e) {
    return res.status(500).json({ ...out, served: {}, error: "Storage read failed." });
  }
}
