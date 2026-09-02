import { describe, expect, it } from "vitest";
import { FAQ, LEGAL_LINKS, POLICIES } from "@/content/policies";

const REQUIRED_ORDER = [
  "terms",
  "shipping",
  "returns",
  "warranty",
  "payments",
  "privacy",
  "ai",
  "accessibility",
  "safety",
  "cookies",
];

describe("policies content", () => {
  it("has all ten policy sections, unique, in the required order", () => {
    expect(POLICIES.map((p) => p.id)).toEqual(REQUIRED_ORDER);
    expect(new Set(POLICIES.map((p) => p.id)).size).toBe(POLICIES.length);
  });

  it("every policy has a non-empty title/summary and a short bullet list", () => {
    // ponytail: the four pre-existing entries (shipping/returns/warranty/payments) already
    // ship with up to 6 bullets and must stay untouched, so the cap here is 6, not the 5
    // used for the new entries this change adds.
    for (const policy of POLICIES) {
      expect(policy.title.length).toBeGreaterThan(0);
      expect(policy.summary.length).toBeGreaterThan(0);
      expect(policy.bullets.length).toBeGreaterThanOrEqual(1);
      expect(policy.bullets.length).toBeLessThanOrEqual(6);
    }
  });

  it("has four FAQ entries with question and answer", () => {
    expect(FAQ.length).toBe(4);
    for (const item of FAQ) {
      expect(item.q.length).toBeGreaterThan(0);
      expect(item.a.length).toBeGreaterThan(0);
    }
  });

  it("every footer legal link's fragment matches a policy id", () => {
    const ids = new Set(POLICIES.map((p) => p.id));
    for (const link of LEGAL_LINKS) {
      const fragment = link.href.split("#")[1];
      expect(fragment).toBeTruthy();
      expect(ids.has(fragment as (typeof POLICIES)[number]["id"])).toBe(true);
    }
  });
});
