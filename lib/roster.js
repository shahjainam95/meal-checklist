import fs from "node:fs";
import path from "node:path";

let cache = null;

export function getRoster() {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "roster.csv");
  const text = fs.readFileSync(file, "utf8");
  cache = parseRoster(text);
  return cache;
}

function parseRoster(text) {
  const rows = parseCsv(text);
  if (!rows.length) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const find = (...keys) =>
    header.findIndex((h) => keys.some((k) => h.includes(k)));

  const iName = find("name");
  const iEmail = find("email", "mail");
  const iLunch = find("lunch");
  const iDinner = find("dinner");

  const seen = new Map();
  const people = [];

  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    if (!cols.length || cols.every((c) => c.trim() === "")) continue;

    const name = (iName >= 0 ? cols[iName] : cols[0] || "").trim();
    const email = (iEmail >= 0 ? cols[iEmail] : "").trim();
    if (!name && !email) continue;

    // Stable id: prefer email, else a slug of the name. De-dupe if needed.
    let base =
      (email || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "person";
    let id = base;
    let n = 2;
    while (seen.has(id)) id = `${base}-${n++}`;
    seen.set(id, true);

    people.push({
      id,
      name: name || email,
      email,
      lunch: toInt(iLunch >= 0 ? cols[iLunch] : 0),
      dinner: toInt(iDinner >= 0 ? cols[iDinner] : 0),
    });
  }

  return people;
}

function toInt(v) {
  const n = parseInt(String(v ?? "").trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Minimal CSV parser: handles quoted fields, escaped quotes, and CRLF.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/^\uFEFF/, ""); // strip BOM

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
