import { describe, expect, it } from "vitest";
import { FAQ, POLICIES } from "@/content/policies";

describe("policies content", () => {
  it("has exactly the four policy sections", () => {
    expect(POLICIES.length).toBe(4);
    expect(POLICIES.map((p) => p.id).sort()).toEqual(["payments", "returns", "shipping", "warranty"]);
  });

  it("every policy has a summary and at least one bullet", () => {
    for (const policy of POLICIES) {
      expect(policy.summary.length).toBeGreaterThan(0);
      expect(policy.bullets.length).toBeGreaterThan(0);
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
});
