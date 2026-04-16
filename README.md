# Trailhead

A web app for hikers who overthink their kit. Inventory tracking, reusable kit list templates, trip planning with GPX routes, and weather-aware packing suggestions pulled from the forecast at your actual route elevation — not just the nearest town.

## Why

Most trip-planning tools are good at one thing. AllTrails finds you routes. A spreadsheet tracks your gear. The Met Office tells you the weather. None of them know that your 3-season sleeping bag is rated to 2°C and the forecast for the col you're sleeping at is showing -4°C on Saturday night.

Trailhead is the single place where your gear, your routes, and the forecast meet — so packing for a trip becomes “here’s what you own that fits these conditions” instead of guesswork.

## Features

- **Gear inventory** — track what you own, with weight, purchase date, temperature ratings, and tags for things like waterproofing or insulation. Soft-retire items you've sold or lost without breaking historical trips.
- **Kit lists** — reusable templates for different kinds of trips (summer day hike, 3-season backpacking, winter bothy). Add items, mark optional extras, reuse across trips.
- **Trip planning** — date-bounded trips that tie together a kit list, one or more routes, and a packing checklist that diverges from the template as you tweak it.
- **Route mapping** — import GPX from Komoot, Strava, OS Maps, or AllTrails. View routes on topographic tiles with elevation profiles, distance, ascent, and time estimates via Naismith's rule.
- **Weather-aware suggestions** — pulls the forecast from Open-Meteo for the actual elevation of your route on your trip dates, then flags gear that's a good or poor match for the conditions.

## Stack

- **Framework** — Next.js 15 (App Router), React 19
- **Language** — TypeScript (strict)
- **Styling** — Tailwind CSS v4 with shadcn/ui
- **Database** — Turso (SQLite) via Drizzle ORM
- **Auth** — Auth.js v5 with Google, GitHub, and email (magic link via Resend)
- **Maps** — MapLibre GL JS with Stadia Maps Outdoors tiles
- **Geospatial** — Turf.js for geometry, @tmcw/togeojson for GPX parsing
- **Weather** — Open-Meteo (no API key required)
- **Hosting** — Vercel (app) + Turso (database)
