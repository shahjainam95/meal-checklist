import fs from "node:fs";
import path from "node:path";

let bundledCache = null;

export function getBundledData() {
  if (bundledCache) return bundledCache;
  const file = path.join(process.cwd(), "data", "roster.csv");
  const text = fs.readFileSync(file, "utf8");
  bundledCache = buildFromText(text);
  return bundledCache;
}

export function buildFromText(text) {
  const rows = parseCsv(text);
  if (!rows.length) return { sessions: [], people: [] };

  const header = rows[0].map((h) => (h || "").trim());
  const lower = header.map((h) => h.toLowerCase());
  const find = (...keys) => lower.findIndex((h) => keys.some((k) => h.includes(k)));

  const iFirst = find("first");
  const iLast = find("last");
  const iName = find("name");
  const iEmail = find("email", "mail");
  const iMobile = find("mobile", "phone");
  const iAt = find("signed up", "signup", "timestamp");

  const sCols = [];
  header.forEach((h, i) => {
    const m = /day\s*(\d+)\s*[-\u2013]\s*(lunch|dinner)/i.exec(h);
    if (m) {
      const day = parseInt(m[1], 10);
      const meal = m[2].toLowerCase();
      sCols.push({
        key: `d${day}${meal[0]}`, day, meal,
        label: `Day ${day} \u00b7 ${meal[0].toUpperCase() + meal.slice(1)}`, col: i,
      });
    }
  });

  const people = [];
  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    if (!cols.length) continue;
    const first = (iFirst >= 0 ? cols[iFirst] : "").trim();
    const last = (iLast >= 0 ? cols[iLast] : "").trim();
    let name = [first, last].filter(Boolean).join(" ").trim();
    if (!name && iName >= 0) name = (cols[iName] || "").trim();
    const email = (iEmail >= 0 ? cols[iEmail] : "").trim();
    if (!name || /^total$/i.test(first) || /^total$/i.test(name)) continue;
    const mobile = (iMobile >= 0 ? cols[iMobile] : "").trim();
    const at = (iAt >= 0 ? cols[iAt] : "").trim();

    const q = {};
    for (const s of sCols) { const n = toInt(cols[s.col]); if (n > 0) q[s.key] = n; }
    const id = "p" + hash(`${email.toLowerCase()}|${at}|${name.toLowerCase()}`);
    people.push({ id, first, last, name, email, mobile, at, q });
  }

  const sessions = sCols.map(({ key, day, meal, label }) => ({ key, day, meal, label }));
  return { sessions, people };
}

// Collapse duplicate signups. rule: "recent" (latest Signed Up At) or "meals" (most meals).
export function cleanPeople(people, rule = "recent") {
  const groups = new Map();
  for (const p of people) {
    const k = (p.email || "").toLowerCase() || `${p.name.toLowerCase()}|${p.mobile}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }
  const total = (p) => Object.values(p.q).reduce((a, b) => a + b, 0);
  const cleaned = [];
  const merges = [];
  for (const [, list] of groups) {
    if (list.length === 1) { cleaned.push(list[0]); continue; }
    const sorted = [...list].sort((a, b) =>
      rule === "meals" ? total(b) - total(a) : (b.at || "").localeCompare(a.at || "")
    );
    const winner = sorted[0];
    cleaned.push(winner);
    merges.push({
      name: winner.name,
      email: winner.email,
      kept: { meals: total(winner), at: winner.at },
      dropped: sorted.slice(1).map((p) => ({ meals: total(p), at: p.at })),
    });
  }
  cleaned.sort((a, b) => a.name.localeCompare(b.name));
  return { people: cleaned, merges };
}

// Rebuild a clean CSV from parsed sessions + people.
export function toCsv(sessions, people) {
  const head = ["First Name", "Last Name", "Email", "Mobile",
    ...sessions.map((s) => s.label.replace(" \u00b7 ", " - ")), "Signed Up At"];
  const lines = [head.map(csvCell).join(",")];
  for (const p of people) {
    const row = [p.first || p.name, p.last || "", p.email, p.mobile,
      ...sessions.map((s) => p.q[s.key] || ""), p.at || ""];
    lines.push(row.map(csvCell).join(","));
  }
  return lines.join("\r\n");
}

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function toInt(v) {
  const s = String(v ?? "").trim();
  if (!s || /\//.test(s)) return 0;
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
function parseCsv(text) {
  const rows = []; let row = [], field = "", q = false;
  const s = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}
