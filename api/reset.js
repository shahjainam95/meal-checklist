import { redis, SERVED_KEY } from "../lib/redis.js";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Use POST." });
  if (!redis)
    return res.status(500).json({ error: "Storage not connected." });

  const body = typeof req.body === "string" ? safeJson(req.body) : req.body || {};
  if (body.confirm !== "RESET")
    return res.status(400).json({ error: "Send { confirm: 'RESET' }." });

  try {
    await redis.del(SERVED_KEY);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Storage reset failed." });
  }
}

function safeJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
