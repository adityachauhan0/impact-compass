import { describe, expect, it } from "vitest";
import { createLockedQueryBundle } from "../domain/queryBundle";
import {
  createQueryDerivedEvidence,
  derivePillarScoresFromEvidence,
  deriveUncertainty,
} from "./queryDerivedReport";

const idea = {
  name: "Invoice follow-up autopilot",
  problem: "Freelancers lose time chasing late client payments.",
  targetUser: "Freelancers and consultants",
  lens: "Productivity / Prosumer SaaS",
};

describe("query-derived report inputs", () => {
  it("creates evidence ledger rows from the locked query bundle", () => {
    const bundle = createLockedQueryBundle({
      problemKeywords: "late client payments, unpaid invoices",
      solutionKeywords: "invoice reminder automation",
      audienceKeywords: "freelancers, consultants",
      competitorKeywords: "HoneyBook alternative",
      exclusions: "medical billing",
    });
    const evidence = createQueryDerivedEvidence(idea, bundle);

    expect(evidence.map((item) => item.query)).toContain("late client payments");
    expect(evidence.map((item) => item.query)).toContain("invoice reminder automation");
    expect(evidence.map((item) => item.query)).toContain("freelancers");
    expect(evidence.some((item) => item.snippet.includes("therapist"))).toBe(false);
    expect(evidence.find((item) => item.metricContribution === "Excluded")).toMatchObject({
      included: false,
      query: "medical billing",
    });
  });

  it("derives all seven pillar scores from generated evidence strengths", () => {
    const bundle = createLockedQueryBundle({
      problemKeywords: "late client payments",
      solutionKeywords: "invoice reminder automation",
      audienceKeywords: "freelancers",
      competitorKeywords: "HoneyBook alternative",
      exclusions: "medical billing",
    });
    const scores = derivePillarScoresFromEvidence(createQueryDerivedEvidence(idea, bundle));

    expect(Object.values(scores).every((score) => score > 0 && score <= 100)).toBe(true);
  });

  it("lowers uncertainty as query controls become more specific", () => {
    const broad = createLockedQueryBundle({
      problemKeywords: "payments",
      solutionKeywords: "",
      audienceKeywords: "",
      competitorKeywords: "",
      exclusions: "",
    });
    const specific = createLockedQueryBundle({
      problemKeywords: "late client payments",
      solutionKeywords: "invoice reminder automation",
      audienceKeywords: "freelancers",
      competitorKeywords: "HoneyBook alternative",
      exclusions: "medical billing",
    });

    expect(deriveUncertainty(specific)).toBeLessThan(deriveUncertainty(broad));
  });
});
