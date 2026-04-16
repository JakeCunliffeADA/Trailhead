import { describe, it, expect } from "vitest";
import {
  generateSuggestions,
  deriveConditions,
  type GearSuggestion,
} from "./match";
import type { DailyWeatherSummary } from "@/lib/weather/fetch";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGear(overrides: Partial<Parameters<typeof generateSuggestions>[0][number]> = {}) {
  return {
    id: "gear-1",
    name: "Test Item",
    brand: null,
    category: null,
    tags: "[]",
    tempRatingLowC: null,
    tempRatingHighC: null,
    retiredAt: null,
    ...overrides,
  };
}

function makeConditions(
  overrides: Partial<Parameters<typeof generateSuggestions>[2]> = {},
): Parameters<typeof generateSuggestions>[2] {
  return {
    forecastMinC: 5,
    forecastMaxC: 15,
    totalPrecipMm: 0,
    maxWindKph: 20,
    ...overrides,
  };
}

function makeSummary(overrides: Partial<DailyWeatherSummary> = {}): DailyWeatherSummary {
  return {
    date: "2025-08-01",
    tempMinC: 5,
    tempMaxC: 15,
    precipMm: 0,
    windMaxKph: 20,
    weathercode: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// deriveConditions
// ---------------------------------------------------------------------------

describe("deriveConditions", () => {
  it("returns null for an empty array", () => {
    expect(deriveConditions([])).toBeNull();
  });

  it("derives min/max temp across multiple days", () => {
    const summaries = [
      makeSummary({ tempMinC: 2, tempMaxC: 10 }),
      makeSummary({ tempMinC: -1, tempMaxC: 8 }),
    ];
    const result = deriveConditions(summaries)!;
    expect(result.forecastMinC).toBe(-1);
    expect(result.forecastMaxC).toBe(10);
  });

  it("sums precipitation across days", () => {
    const summaries = [
      makeSummary({ precipMm: 3.5 }),
      makeSummary({ precipMm: 2.0 }),
    ];
    const result = deriveConditions(summaries)!;
    expect(result.totalPrecipMm).toBeCloseTo(5.5);
  });

  it("takes the max wind speed across days", () => {
    const summaries = [
      makeSummary({ windMaxKph: 30 }),
      makeSummary({ windMaxKph: 65 }),
    ];
    const result = deriveConditions(summaries)!;
    expect(result.maxWindKph).toBe(65);
  });
});

// ---------------------------------------------------------------------------
// generateSuggestions — temperature adequacy
// ---------------------------------------------------------------------------

describe("generateSuggestions — temperature adequacy", () => {
  it("returns good for packed gear whose rating suits the forecast low", () => {
    const gear = [makeGear({ id: "bag-1", name: "Sleeping bag", tempRatingLowC: 0 })];
    const conditions = makeConditions({ forecastMinC: 5 }); // rating (0) <= min (5)
    const suggestions = generateSuggestions(gear, new Set(["bag-1"]), conditions);

    const match = suggestions.find((s) => s.gearItemId === "bag-1");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("good");
    expect(match!.alreadyPacked).toBe(true);
  });

  it("returns warn for packed gear whose rating is above the forecast low", () => {
    const gear = [makeGear({ id: "bag-1", name: "Summer bag", tempRatingLowC: 8 })];
    const conditions = makeConditions({ forecastMinC: 2 }); // rating (8) > min (2)
    const suggestions = generateSuggestions(gear, new Set(["bag-1"]), conditions);

    const match = suggestions.find((s) => s.gearItemId === "bag-1");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("warn");
    expect(match!.reason).toMatch(/too cold/i);
  });

  it("returns info for unpacked gear that suits the forecast low", () => {
    const gear = [makeGear({ id: "bag-1", name: "3-season bag", tempRatingLowC: -2 })];
    const conditions = makeConditions({ forecastMinC: 4 }); // rating within -15 of min
    const suggestions = generateSuggestions(gear, new Set(), conditions);

    const match = suggestions.find((s) => s.gearItemId === "bag-1");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("info");
    expect(match!.alreadyPacked).toBe(false);
  });

  it("does not suggest unpacked gear rated far below the forecast range", () => {
    // Rating (-20) is > 15 below forecast min (4) — too cold to be relevant
    const gear = [makeGear({ id: "bag-1", name: "Expedition bag", tempRatingLowC: -20 })];
    const conditions = makeConditions({ forecastMinC: 4 });
    const suggestions = generateSuggestions(gear, new Set(), conditions);

    expect(suggestions.find((s) => s.gearItemId === "bag-1")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// generateSuggestions — waterproofing
// ---------------------------------------------------------------------------

describe("generateSuggestions — waterproofing", () => {
  it("returns good for packed waterproof gear when rain > 5 mm", () => {
    const gear = [makeGear({ id: "jacket-1", name: "Rain jacket", tags: '["waterproof"]' })];
    const conditions = makeConditions({ totalPrecipMm: 12 });
    const suggestions = generateSuggestions(gear, new Set(["jacket-1"]), conditions);

    const match = suggestions.find((s) => s.gearItemId === "jacket-1");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("good");
  });

  it("returns info for unpacked waterproof gear when rain > 5 mm", () => {
    const gear = [makeGear({ id: "jacket-1", name: "Rain jacket", tags: '["waterproof"]' })];
    const conditions = makeConditions({ totalPrecipMm: 12 });
    const suggestions = generateSuggestions(gear, new Set(), conditions);

    const match = suggestions.find((s) => s.gearItemId === "jacket-1");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("info");
    expect(match!.alreadyPacked).toBe(false);
  });

  it("produces no waterproof suggestion when rain is minimal", () => {
    const gear = [makeGear({ id: "jacket-1", name: "Rain jacket", tags: '["waterproof"]' })];
    const conditions = makeConditions({ totalPrecipMm: 2 }); // below 5 mm threshold
    const suggestions = generateSuggestions(gear, new Set(), conditions);

    expect(suggestions.find((s) => s.gearItemId === "jacket-1")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// generateSuggestions — wind protection
// ---------------------------------------------------------------------------

describe("generateSuggestions — wind protection", () => {
  it("returns good for packed windproof gear when gusts > 50 kph", () => {
    const gear = [makeGear({ id: "shell-1", name: "Wind shell", tags: '["windproof"]' })];
    const conditions = makeConditions({ maxWindKph: 65 });
    const suggestions = generateSuggestions(gear, new Set(["shell-1"]), conditions);

    expect(suggestions.find((s) => s.gearItemId === "shell-1")?.severity).toBe("good");
  });

  it("produces no wind suggestion below 50 kph threshold", () => {
    const gear = [makeGear({ id: "shell-1", name: "Wind shell", tags: '["windproof"]' })];
    const conditions = makeConditions({ maxWindKph: 40 });
    const suggestions = generateSuggestions(gear, new Set(), conditions);

    expect(suggestions.find((s) => s.gearItemId === "shell-1")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// generateSuggestions — deduplication and ordering
// ---------------------------------------------------------------------------

describe("generateSuggestions — deduplication and ordering", () => {
  it("deduplicates by gearItemId, keeping the highest severity", () => {
    // Gear that is both temp-rated (good) AND waterproof (info) — should keep good
    const gear = [
      makeGear({
        id: "jacket-1",
        name: "Waterproof insulated jacket",
        tags: '["waterproof"]',
        tempRatingLowC: 2,
      }),
    ];
    const conditions = makeConditions({ forecastMinC: 5, totalPrecipMm: 10 });
    const suggestions = generateSuggestions(gear, new Set(["jacket-1"]), conditions);

    const matches = suggestions.filter((s) => s.gearItemId === "jacket-1");
    expect(matches).toHaveLength(1);
    expect(matches[0].severity).toBe("good");
  });

  it("orders results warn → good → info", () => {
    const gear = [
      makeGear({ id: "a", name: "Item A", tempRatingLowC: 10 }), // warn (packed, inadequate)
      makeGear({ id: "b", name: "Item B", tags: '["waterproof"]' }), // info (unpacked, rain)
      makeGear({ id: "c", name: "Item C", tempRatingLowC: 0 }),  // good (packed, adequate)
    ];
    const conditions = makeConditions({ forecastMinC: 2, totalPrecipMm: 8 });
    const packed = new Set(["a", "c"]);
    const suggestions = generateSuggestions(gear, packed, conditions);

    const severities = suggestions.map((s) => s.severity);
    const warnIdx = severities.indexOf("warn");
    const goodIdx = severities.indexOf("good");
    const infoIdx = severities.indexOf("info");
    expect(warnIdx).toBeLessThan(goodIdx);
    expect(goodIdx).toBeLessThan(infoIdx);
  });
});

// ---------------------------------------------------------------------------
// generateSuggestions — retired gear
// ---------------------------------------------------------------------------

describe("generateSuggestions — retired gear", () => {
  it("excludes retired gear from all suggestions", () => {
    const gear = [
      makeGear({
        id: "old-bag",
        name: "Old sleeping bag",
        tempRatingLowC: 0,
        retiredAt: new Date(2024, 0, 1),
      }),
    ];
    const conditions = makeConditions({ forecastMinC: 5 });
    const suggestions = generateSuggestions(gear, new Set(["old-bag"]), conditions);

    expect(suggestions).toHaveLength(0);
  });
});
