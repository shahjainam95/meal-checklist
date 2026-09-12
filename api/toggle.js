import { redis, SERVED_KEY } from "../lib/redis.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  if (!redis) return res.status(500).json({ error: "Storage not connected." });

  const body = typeof req.body === "string" ? safeJson(req.body) : req.body || {};
  const { id, session, collected } = body;
  if (!id || !/^d\d+[ld]$/.test(session || ""))
    return res.status(400).json({ error: "Need id and a valid session." });

  const field = `${session}:${id}`;
  try {
    if (collected) await redis.hset(SERVED_KEY, { [field]: 1 });
    else await redis.hdel(SERVED_KEY, field);
    return res.status(200).json({ ok: true, field, collected: !!collected });
  } catch (e) {
    return res.status(500).json({ error: "Storage write failed." });
  }
}
function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
