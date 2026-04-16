# Trailhead

A web app for hikers who overthink their kit. Inventory tracking, reusable kit list templates, trip planning with GPX routes, and weather-aware packing suggestions pulled from the forecast at your actual route elevation — not just the nearest town.

## Why

Most trip-planning tools are good at one thing. AllTrails finds you routes. A spreadsheet tracks your gear. The Met Office tells you the weather. None of them know that your 3-season sleeping bag is rated to 2°C and the forecast for the col you're sleeping at is showing -4°C on Saturday night.

Trailhead is the single place where your gear, your routes, and the forecast meet — so packing for a trip becomes "here's what you own that fits these conditions" instead of guesswork.

## Features

- **Gear inventory** — track what you own, with weight, purchase date, temperature ratings, and tags for things like waterproofing or insulation. Soft-retire items you've sold or lost without breaking historical trips.
- **Kit lists** — reusable templates for different kinds of trips (summer day hike, 3-season backpacking, winter bothy). Add items, mark optional extras, reuse across trips.
- **Trip planning** — date-bounded trips that tie together a kit list, one or more routes, and a packing checklist that diverges from the template as you tweak it.
- **Route mapping** — import GPX from Komoot, Strava, OS Maps, or AllTrails. View routes on topographic tiles with elevation profiles, distance, ascent, and time estimates via Naismith's rule.
- **Weather-aware suggestions** — pulls the forecast from Open-Meteo for the actual elevation of your route on your trip dates, then flags gear that's a good or poor match for the conditions.

## Stack

- **Framework** — [Next.js 15](https://nextjs.org/) (App Router), React 19
- **Language** — TypeScript (strict)
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **Database** — [Turso](https://turso.tech/) (SQLite) via [Drizzle ORM](https://orm.drizzle.team/)
- **Auth** — [Auth.js v5](https://authjs.dev/) with Google, GitHub, and email (magic link via [Resend](https://resend.com/))
- **Maps** — [MapLibre GL JS](https://maplibre.org/) with [Stadia Maps](https://stadiamaps.com/) Outdoors tiles
- **Geospatial** — [Turf.js](https://turfjs.org/) for geometry, `@tmcw/togeojson` for GPX parsing
- **Weather** — [Open-Meteo](https://open-meteo.com/) (no API key required)
- **Hosting** — Vercel (app) + Turso (database)

## Getting started

### Prerequisites

- Node.js 20 LTS
- [pnpm](https://pnpm.io/) 9+
- A [Turso](https://turso.tech/) account (free tier is plenty)
- OAuth app credentials for the providers you want to enable

### Setup

```bash
git clone https://github.com/<your-username>/trailhead.git
cd trailhead
pnpm install
cp .env.example .env.local
```

Fill in `.env.local` — see [Environment variables](#environment-variables) below.

### Database

```bash
pnpm db:push      # push schema to Turso
pnpm db:seed      # optional: populate with sample gear and a kit list
```

### Run

```bash
pnpm dev
```

Open <http://localhost:3000>.

## Environment variables

```bash
# Auth.js
AUTH_SECRET=                    # openssl rand -base64 32
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=                 # optional
AUTH_GITHUB_SECRET=             # optional
AUTH_RESEND_KEY=                # optional, for magic-link auth
AUTH_EMAIL_FROM=                # required if AUTH_RESEND_KEY set

# Turso
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Maps
NEXT_PUBLIC_STADIA_API_KEY=     # free tier, 200k tiles/month
```

### Setting up OAuth providers

- **Google** — [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth client ID. Redirect URI: `http://localhost:3000/api/auth/callback/google` (and your production URL).
- **GitHub** — Settings → Developer Settings → OAuth Apps → New. Callback URL: `http://localhost:3000/api/auth/callback/github`.

## Scripts

```bash
pnpm dev          # start dev server
pnpm build        # production build
pnpm start        # run production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # ESLint
pnpm test         # Vitest
pnpm db:push      # apply schema to database
pnpm db:studio    # open Drizzle Studio
pnpm db:seed      # seed sample data
```

## Project structure

```
src/
├── app/              # Next.js App Router routes
├── components/       # Shared UI components (shadcn/ui lives here)
├── db/               # Drizzle schema and client
├── lib/              # Domain logic — gear matching, route parsing, weather
│   ├── gpx/
│   ├── routing/
│   ├── weather/
│   └── suggestions/  # Kit-to-forecast matching
├── server/           # Server actions and data-access helpers
└── auth.ts           # Auth.js config
scripts/
└── seed.ts           # Dev seed data
```

## Design notes

A few decisions that are worth knowing about before contributing or forking:

- **Everything metric internally, imperial on display.** All measurements are stored in metres, kilometres, °C, and m/s. Conversion happens at the display layer based on user preference. Default display: miles for distance, metres for elevation, °C for temperature.
- **Trips snapshot their kit.** Adding a kit to a trip copies its items rather than referencing them live. Editing a kit doesn't retroactively change past trips.
- **Routes store both GeoJSON and the original GPX.** GeoJSON is what the app uses; the original GPX is kept so routes can be re-parsed later if the parsing logic improves.
- **Weather is cached per-trip.** Open-Meteo calls are cheap but not free-speed, so forecasts are cached with a staleness check rather than fetched on every page load.
- **Single-user now, multi-user ready.** Every user-owned table has a `userId` column. Sharing features aren't built, but the schema won't need to change to add them.

## Roadmap

- [ ] Gear inventory CRUD
- [ ] Kit list builder
- [ ] GPX import and route visualisation
- [ ] Trip creation flow
- [ ] Weather integration with elevation-adjusted forecasts
- [ ] Packing suggestion algorithm
- [ ] Item photos (via Vercel Blob or R2)
- [ ] PWA / offline support for trip day
- [ ] Sharing trips and kit lists with other users
- [ ] Export packing list as PDF or print view

## Licence

[MIT](./LICENSE) — do what you like, no warranty.

## Acknowledgements

- [Open-Meteo](https://open-meteo.com/) for the weather API
- [OpenStreetMap](https://www.openstreetmap.org/) contributors and [Stadia Maps](https://stadiamaps.com/) for the map tiles
- Every hiker who's ever forgotten a waterproof
