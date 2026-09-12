import { redis, SERVED_KEY } from "../lib/redis.js";
import { getLiveData } from "../lib/data.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  if (!redis) return res.status(500).json({ error: "Storage not connected." });
  const body = typeof req.body === "string" ? safeJson(req.body) : req.body || {};
  if (body.confirm !== "RESET") return res.status(400).json({ error: "Send confirm: RESET." });
  try {
    const session = body.session;
    if (session && /^d\d+[ld]$/.test(session)) {
      const { people } = await getLiveData();
      const fields = people.filter((p) => p.q[session]).map((p) => `${session}:${p.id}`);
      if (fields.length) await redis.hdel(SERVED_KEY, ...fields);
      return res.status(200).json({ ok: true, cleared: fields.length, session });
    }
    await redis.del(SERVED_KEY);
    return res.status(200).json({ ok: true, cleared: "all" });
  } catch (e) {
    return res.status(500).json({ error: "Storage reset failed." });
  }
}
function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
