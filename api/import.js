import { redis, ROSTER_KEY } from "../lib/redis.js";
import { buildFromText, cleanPeople, toCsv } from "../lib/roster.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  const body = typeof req.body === "string" ? safeJson(req.body) : req.body || {};
  const { csv, rule = "recent", commit = false, password = "" } = body;

  if (!csv || typeof csv !== "string")
    return res.status(400).json({ error: "No CSV provided." });

  let parsed;
  try {
    parsed = buildFromText(csv);
  } catch (e) {
    return res.status(400).json({ error: "Could not parse that CSV." });
  }
  if (!parsed.sessions.length)
    return res.status(400).json({ error: "No 'Day N - Lunch/Dinner' columns found. Is this the right file?" });

  const { people: cleaned, merges } = cleanPeople(parsed.people, rule === "meals" ? "meals" : "recent");

  const platesRaw = sumPlates(parsed.people);
  const platesClean = sumPlates(cleaned);

  const summary = {
    rule: rule === "meals" ? "meals" : "recent",
    rawRows: parsed.people.length,
    people: cleaned.length,
    merged: parsed.people.length - cleaned.length,
    sessions: parsed.sessions.length,
    platesRaw, platesClean,
    examples: merges.slice(0, 8),
  };

  if (!commit) {
    return res.status(200).json({ ok: true, dryRun: true, summary,
      cleanedCsv: toCsv(parsed.sessions, cleaned) });
  }

  // Publishing to the live app requires the admin passcode.
  if (!redis) return res.status(500).json({ error: "Storage not connected." });
  if (!process.env.ADMIN_PASSWORD)
    return res.status(400).json({ error: "Set an ADMIN_PASSWORD env var in Vercel to publish." });
  if (password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: "Wrong passcode." });

  try {
    await redis.set(ROSTER_KEY, JSON.stringify({
      sessions: parsed.sessions, people: cleaned, importedAt: Date.now(),
    }));
    return res.status(200).json({ ok: true, published: true, summary });
  } catch (e) {
    return res.status(500).json({ error: "Publish failed while saving." });
  }
}

function sumPlates(people) {
  let t = 0;
  for (const p of people) for (const k in p.q) t += p.q[k];
  return t;
}
function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
