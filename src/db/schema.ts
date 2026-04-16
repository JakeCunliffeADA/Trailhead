import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Auth tables (Auth.js v5 adapter schema)
// ---------------------------------------------------------------------------

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp_ms" }),
  image: text("image"),
  // User display preferences
  unitDistance: text("unit_distance", { enum: ["miles", "km"] })
    .notNull()
    .default("miles"),
  unitTemperature: text("unit_temperature", { enum: ["celsius", "fahrenheit"] })
    .notNull()
    .default("celsius"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    // Auth.js adapter requires these exact TypeScript field names
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [uniqueIndex("accounts_provider_account").on(t.provider, t.providerAccountId)],
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [uniqueIndex("verification_tokens_identifier_token").on(t.identifier, t.token)],
);

// ---------------------------------------------------------------------------
// Gear inventory
// ---------------------------------------------------------------------------

/**
 * An item a user owns.
 * All measurements are stored in SI units:
 *   weight → grams, temperature → °C, length → metres
 */
export const gearItems = sqliteTable("gear_items", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  brand: text("brand"),
  category: text("category"), // e.g. "sleep", "shelter", "insulation", "footwear"
  description: text("description"),
  weightGrams: real("weight_grams"), // stored as grams
  purchaseDate: integer("purchase_date", { mode: "timestamp_ms" }),
  // Temperature ratings in °C (for sleeping bags, insulation, etc.)
  tempRatingLowC: real("temp_rating_low_c"),
  tempRatingHighC: real("temp_rating_high_c"),
  // Freeform tags, stored as JSON array of strings e.g. '["waterproof","3-season"]'
  tags: text("tags").notNull().default("[]"),
  // Soft-retire: item still appears in history but is excluded from suggestions
  retiredAt: integer("retired_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ---------------------------------------------------------------------------
// Kit lists
// ---------------------------------------------------------------------------

/**
 * A reusable template of gear items for a type of trip.
 * e.g. "Summer day hike", "3-season backpacking", "Winter bothy"
 */
export const kitLists = sqliteTable("kit_lists", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/**
 * An item within a kit list template.
 */
export const kitListItems = sqliteTable("kit_list_items", {
  id: text("id").primaryKey(),
  kitListId: text("kit_list_id")
    .notNull()
    .references(() => kitLists.id, { onDelete: "cascade" }),
  gearItemId: text("gear_item_id")
    .notNull()
    .references(() => gearItems.id, { onDelete: "cascade" }),
  optional: integer("optional", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * A GPX/GeoJSON route imported by a user.
 * Stores both the processed GeoJSON (what the app uses) and the original GPX
 * (kept so routes can be re-parsed if the parsing logic improves).
 * All measurements stored in SI: distance_m (metres), ascent_m, descent_m.
 */
export const routes = sqliteTable("routes", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  source: text("source", {
    enum: ["komoot", "strava", "os_maps", "alltrails", "other"],
  }),
  // Derived stats (all in SI)
  distanceM: real("distance_m"), // metres
  ascentM: real("ascent_m"), // metres
  descentM: real("descent_m"), // metres
  minElevationM: real("min_elevation_m"),
  maxElevationM: real("max_elevation_m"),
  // Naismith's rule estimate in minutes
  naismith_minutes: integer("naismith_minutes"),
  // Processed GeoJSON FeatureCollection (LineString with elevation)
  geojson: text("geojson").notNull(),
  // Raw GPX file content
  gpxRaw: text("gpx_raw").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

/**
 * A date-bounded trip. Ties together a kit list snapshot, routes, and
 * a checklist. The kit list is snapshotted on creation — edits to the
 * source kit list do not retroactively change trips.
 */
export const trips = sqliteTable("trips", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  startDate: integer("start_date", { mode: "timestamp_ms" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/**
 * Routes attached to a trip (many-to-many).
 */
export const tripRoutes = sqliteTable(
  "trip_routes",
  {
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    routeId: text("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number"), // which day of the trip this route is for
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("trip_routes_trip_route").on(t.tripId, t.routeId)],
);

/**
 * A packing checklist item on a specific trip. Created by snapshotting
 * the kit list at trip-creation time, then diverging as the user tweaks it.
 */
export const tripPackingItems = sqliteTable("trip_packing_items", {
  id: text("id").primaryKey(),
  tripId: text("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  // Snapshot of the gear item data at time of trip creation
  gearItemId: text("gear_item_id").references(() => gearItems.id, {
    onDelete: "set null",
  }),
  // Denormalised snapshot so the trip record is self-contained
  name: text("name").notNull(),
  weightGrams: real("weight_grams"),
  category: text("category"),
  optional: integer("optional", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  packed: integer("packed", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ---------------------------------------------------------------------------
// Weather cache
// ---------------------------------------------------------------------------

/**
 * Cached Open-Meteo forecast for a trip.
 * Keyed on (trip_id, route_id, date) — one cache entry per route per day.
 * The `stale_after` timestamp drives the staleness check; expired entries
 * are re-fetched on next page load.
 */
export const weatherCache = sqliteTable(
  "weather_cache",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    routeId: text("route_id").references(() => routes.id, {
      onDelete: "cascade",
    }),
    // The date this forecast is for (midnight UTC, stored as ms)
    forecastDate: integer("forecast_date", { mode: "timestamp_ms" }).notNull(),
    // Elevation at which the forecast was sampled (metres)
    elevationM: real("elevation_m").notNull(),
    // Full Open-Meteo hourly response stored as JSON
    forecastJson: text("forecast_json").notNull(),
    fetchedAt: integer("fetched_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    staleAfter: integer("stale_after", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    uniqueIndex("weather_cache_trip_route_date").on(
      t.tripId,
      t.routeId,
      t.forecastDate,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type GearItem = typeof gearItems.$inferSelect;
export type NewGearItem = typeof gearItems.$inferInsert;

export type KitList = typeof kitLists.$inferSelect;
export type NewKitList = typeof kitLists.$inferInsert;

export type KitListItem = typeof kitListItems.$inferSelect;
export type NewKitListItem = typeof kitListItems.$inferInsert;

export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;

export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;

export type TripPackingItem = typeof tripPackingItems.$inferSelect;
export type NewTripPackingItem = typeof tripPackingItems.$inferInsert;

export type WeatherCache = typeof weatherCache.$inferSelect;
export type NewWeatherCache = typeof weatherCache.$inferInsert;
