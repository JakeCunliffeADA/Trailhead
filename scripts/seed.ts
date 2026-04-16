/**
 * Dev seed script — populates the database with sample gear and a kit list.
 * Run with: pnpm db:seed
 *
 * Safe to re-run: uses upsert-style inserts (onConflictDoNothing).
 */

import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import {
  users,
  gearItems,
  kitLists,
  kitListItems,
} from "../src/db/schema";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL is not set — check your .env.local");
  process.exit(1);
}

const client = createClient({ url, authToken });
const db = drizzle(client);

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SEED_USER_ID = "seed_user_01";

const SEED_GEAR: (typeof gearItems.$inferInsert)[] = [
  {
    id: "gear_sleeping_bag_01",
    userId: SEED_USER_ID,
    name: "Rab Neutrino 400",
    brand: "Rab",
    category: "sleep",
    weightGrams: 1060,
    tempRatingLowC: -9,
    tempRatingHighC: 2,
    tags: JSON.stringify(["3-season", "down", "sleeping-bag"]),
    description: "Down sleeping bag rated to -9°C comfort (EN 13537).",
  },
  {
    id: "gear_tent_01",
    userId: SEED_USER_ID,
    name: "Terra Nova Laser Compact 1",
    brand: "Terra Nova",
    category: "shelter",
    weightGrams: 910,
    tags: JSON.stringify(["ultralight", "3-season", "shelter"]),
    description: "Single-person ultralight tent, 910g packed weight.",
  },
  {
    id: "gear_jacket_hardshell_01",
    userId: SEED_USER_ID,
    name: "Rab Latok Alpine GTX",
    brand: "Rab",
    category: "insulation",
    weightGrams: 490,
    tags: JSON.stringify(["waterproof", "hardshell", "gore-tex", "wind"]),
    description: "Gore-Tex hardshell jacket, ideal for alpine conditions.",
  },
  {
    id: "gear_jacket_down_01",
    userId: SEED_USER_ID,
    name: "Montane Anti-Freeze Down Jacket",
    brand: "Montane",
    category: "insulation",
    weightGrams: 325,
    tags: JSON.stringify(["down", "insulation", "packable"]),
    description: "850fp down jacket, compresses to 1.2L.",
  },
  {
    id: "gear_boots_01",
    userId: SEED_USER_ID,
    name: "Scarpa Zodiac Plus GTX",
    brand: "Scarpa",
    category: "footwear",
    weightGrams: 1380,
    tags: JSON.stringify(["waterproof", "boots", "4-season", "gore-tex"]),
    description: "Stiff leather boots for winter hillwalking and scrambling.",
  },
  {
    id: "gear_trousers_01",
    userId: SEED_USER_ID,
    name: "Páramo Velez Adventure Trousers",
    brand: "Páramo",
    category: "clothing",
    weightGrams: 610,
    tags: JSON.stringify(["waterproof", "softshell", "wind"]),
    description: "Nikwax Analogy fabric — waterproof and breathable.",
  },
  {
    id: "gear_mat_01",
    userId: SEED_USER_ID,
    name: "Therm-a-Rest NeoAir XLite NXT",
    brand: "Therm-a-Rest",
    category: "sleep",
    weightGrams: 354,
    tags: JSON.stringify(["inflatable", "sleeping-mat", "4-season"]),
    description: "R-value 4.5, inflatable, 354g. Suitable down to -7°C.",
  },
  {
    id: "gear_stove_01",
    userId: SEED_USER_ID,
    name: "MSR PocketRocket 2",
    brand: "MSR",
    category: "cooking",
    weightGrams: 73,
    tags: JSON.stringify(["stove", "canister", "cooking"]),
    description: "Canister stove, 73g body weight (canister not included).",
  },
  {
    id: "gear_headtorch_01",
    userId: SEED_USER_ID,
    name: "Petzl Actik Core",
    brand: "Petzl",
    category: "lighting",
    weightGrams: 70,
    tags: JSON.stringify(["lighting", "head-torch", "rechargeable"]),
    description: "450 lumens, USB rechargeable.",
  },
  {
    id: "gear_first_aid_01",
    userId: SEED_USER_ID,
    name: "Adventure Medical Kits Ultralight",
    brand: "Adventure Medical Kits",
    category: "safety",
    weightGrams: 198,
    tags: JSON.stringify(["first-aid", "safety"]),
    description: "Compact first aid kit for solo trips.",
  },
];

const SEED_KIT_LIST_3_SEASON: typeof kitLists.$inferInsert = {
  id: "kit_3_season_backpacking",
  userId: SEED_USER_ID,
  name: "3-Season Backpacking",
  description:
    "Overnight and multi-day kit for spring through autumn hillwalking in the UK.",
};

const SEED_KIT_LIST_DAY_HIKE: typeof kitLists.$inferInsert = {
  id: "kit_summer_day_hike",
  userId: SEED_USER_ID,
  name: "Summer Day Hike",
  description: "Light day pack for a single-day summer hike in good conditions.",
};

const SEED_KIT_ITEMS_3_SEASON: (typeof kitListItems.$inferInsert)[] = [
  { id: "kli_01", kitListId: SEED_KIT_LIST_3_SEASON.id!, gearItemId: "gear_sleeping_bag_01", optional: false, sortOrder: 0 },
  { id: "kli_02", kitListId: SEED_KIT_LIST_3_SEASON.id!, gearItemId: "gear_tent_01", optional: false, sortOrder: 1 },
  { id: "kli_03", kitListId: SEED_KIT_LIST_3_SEASON.id!, gearItemId: "gear_jacket_hardshell_01", optional: false, sortOrder: 2 },
  { id: "kli_04", kitListId: SEED_KIT_LIST_3_SEASON.id!, gearItemId: "gear_jacket_down_01", optional: true, sortOrder: 3 },
  { id: "kli_05", kitListId: SEED_KIT_LIST_3_SEASON.id!, gearItemId: "gear_boots_01", optional: false, sortOrder: 4 },
  { id: "kli_06", kitListId: SEED_KIT_LIST_3_SEASON.id!, gearItemId: "gear_mat_01", optional: false, sortOrder: 5 },
  { id: "kli_07", kitListId: SEED_KIT_LIST_3_SEASON.id!, gearItemId: "gear_stove_01", optional: true, sortOrder: 6 },
  { id: "kli_08", kitListId: SEED_KIT_LIST_3_SEASON.id!, gearItemId: "gear_headtorch_01", optional: false, sortOrder: 7 },
  { id: "kli_09", kitListId: SEED_KIT_LIST_3_SEASON.id!, gearItemId: "gear_first_aid_01", optional: false, sortOrder: 8 },
];

const SEED_KIT_ITEMS_DAY_HIKE: (typeof kitListItems.$inferInsert)[] = [
  { id: "kli_dh_01", kitListId: SEED_KIT_LIST_DAY_HIKE.id!, gearItemId: "gear_jacket_hardshell_01", optional: false, sortOrder: 0 },
  { id: "kli_dh_02", kitListId: SEED_KIT_LIST_DAY_HIKE.id!, gearItemId: "gear_jacket_down_01", optional: true, sortOrder: 1 },
  { id: "kli_dh_03", kitListId: SEED_KIT_LIST_DAY_HIKE.id!, gearItemId: "gear_first_aid_01", optional: false, sortOrder: 2 },
  { id: "kli_dh_04", kitListId: SEED_KIT_LIST_DAY_HIKE.id!, gearItemId: "gear_headtorch_01", optional: true, sortOrder: 3 },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  console.log("Seeding database…");

  // Seed user
  await db
    .insert(users)
    .values({
      id: SEED_USER_ID,
      name: "Demo Hiker",
      email: "demo@trailhead.app",
    })
    .onConflictDoNothing();

  await db.insert(gearItems).values(SEED_GEAR).onConflictDoNothing();
  console.log(`  ✓ ${SEED_GEAR.length} gear items`);

  await db
    .insert(kitLists)
    .values([SEED_KIT_LIST_3_SEASON, SEED_KIT_LIST_DAY_HIKE])
    .onConflictDoNothing();
  await db
    .insert(kitListItems)
    .values([...SEED_KIT_ITEMS_3_SEASON, ...SEED_KIT_ITEMS_DAY_HIKE])
    .onConflictDoNothing();
  console.log("  ✓ 2 kit lists");

  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
