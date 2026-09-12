# Meal Check-off

A shared, live checklist for volunteers to mark each person's **lunch** and **dinner** as collected.
Everyone sees the same state, updated every few seconds. Works great on phones.

- Search by name or email
- Filter to "Lunch pending" / "Dinner pending"
- Each person shows how many meals they get (the number on the button)
- Live progress bars for meals served
- "Reset all check-offs" to reuse for the next event

## 1. Add your data

Replace `data/roster.csv` with your file. Keep a header row. These column names are recognized
(any order, case-insensitive): **name**, **email**, **lunch**, **dinner**.

```
name,email,lunch,dinner
Aarav Shah,aarav.shah@example.com,2,2
```

`lunch` / `dinner` are the number of meals that person gets. Use `0` if they have none of that meal.

## 2. Put it on GitHub

Create a new repository at github.com and upload all these files (GitHub's web "Add file → Upload files"
works from a phone).

## 3. Deploy to Vercel

1. Go to vercel.com → **Add New… → Project** → import your repo → **Deploy**.
2. In the project, open **Storage → Create Database → Upstash for Redis** → create it → **Connect** to this project.
   (This automatically adds the database credentials as environment variables.)
3. Open **Deployments → … → Redeploy** so it picks up the database.

Open the site — the top banner disappears once storage is connected. Share the URL with your volunteers.

## Reset between events

Tap **Reset all check-offs** at the bottom and type `RESET`. This clears everyone's collected state.
(Editing the roster later: update `data/roster.csv`, push to GitHub, Vercel redeploys automatically.)

## How it works

- `index.html` — the app (plain HTML/JS, no build step)
- `api/state.js` — returns the roster + shared collected state
- `api/toggle.js` — marks a lunch/dinner collected or not
- `api/reset.js` — clears all collected state
- `lib/roster.js` — parses `data/roster.csv`
- `lib/redis.js` — connects to Upstash Redis
