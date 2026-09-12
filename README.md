# Paryushan Meal Check-off

A shared, live checklist for volunteers to serve meals across the 8 days of Paryushan, plus an
admin page to clean up and publish the signup roster.

## Volunteer app (`/`)

- Pick the session: Day tabs (1–8) + Lunch/Dinner (Day 8 is lunch only)
- See everyone signed up for that session with their plate count
- Tap a row to mark collected; live progress for people + plates
- Search by name, mobile, or email; "Not collected" filter
- All volunteers share the same state, refreshed every few seconds
- Per-session reset

## Roster admin (`/admin.html`)

Upload a signup CSV, clean up duplicate signups, then download the cleaned file or publish it live.

- Auto-detects `Day N - Lunch/Dinner` columns plus name, email, mobile, signup time
- Ignores the `TOTAL` footer row
- Merges duplicate signups by one of two rules you choose:
  - **Most recent signup wins** (default) — treats the latest submission as final
  - **Most meals wins** — keeps the largest signup
- Shows a preview: how many merged, plates before/after, and example merges
- **Download cleaned CSV** — nothing is published; use this to hand-fix outliers and re-upload
- **Publish to live** — replaces the roster for all volunteers instantly (needs the passcode below)

> Note: neither merge rule is perfect when someone re-submitted with a *different* meal count.
> The preview lists the merges so you can spot outliers; if one looks wrong, download the cleaned
> CSV, fix that row, and re-upload.

## Deploy to Vercel

1. Put these files in a new GitHub repo (github.com → New repository → Add file → Upload files).
2. vercel.com → Add New… → Project → import the repo → Deploy.
3. Storage → Create Database → **Upstash for Redis** → Connect to this project.
4. To allow publishing from the admin page: Project → Settings → Environment Variables →
   add **ADMIN_PASSWORD** = a passcode of your choice.
5. Deployments → ⋯ → Redeploy.

Share the base URL with volunteers. Keep `/admin.html` + the passcode to yourself.

## How the data flows

- The volunteer app reads the **published** roster from Redis if one exists, otherwise the
  `data/roster.csv` bundled in the repo. So you can either commit a CSV and redeploy, or just
  publish from the admin page — no redeploy needed.
- Check-offs are keyed to each person's email + signup time. Re-publishing a cleaned roster
  keeps check-offs aligned for people whose entry is unchanged.

## Files

- `index.html` — volunteer app
- `admin.html` — upload / clean / publish roster
- `api/state.js` — sessions + people + shared collected state
- `api/toggle.js` — mark a person collected for a session
- `api/reset.js` — clear a session (or everything)
- `api/import.js` — clean a CSV (dry-run) and publish it (guarded by ADMIN_PASSWORD)
- `lib/roster.js` — CSV parsing, dedupe, CSV rebuild
- `lib/data.js` — resolves the live roster (Redis, else bundled CSV)
- `lib/redis.js` — Upstash Redis connection
