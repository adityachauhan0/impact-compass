import { describe, expect, it } from "vitest";
import { createLockedQueryBundle } from "../domain/queryBundle";
import { buildCompassReport } from "./reportBuilder";
import { therapyEvidenceSeed, therapyPillarScores } from "./therapySeed";

describe("report builder service", () => {
  it("builds a report from supplied idea and locked query bundle", () => {
    const report = buildCompassReport({
      idea: {
        name: "Invoice follow-up autopilot",
        problem: "Freelancers lose time chasing late client payments.",
        targetUser: "Freelancers and consultants",
        lens: "Productivity / Prosumer SaaS",
      },
      queryBundle: createLockedQueryBundle({
        problemKeywords: "late client payments",
        solutionKeywords: "invoice reminder automation",
        audienceKeywords: "freelancers, consultants",
        competitorKeywords: "HoneyBook alternative",
        exclusions: "medical billing",
      }),
      evidence: therapyEvidenceSeed,
      pillarScores: therapyPillarScores,
      uncertainty: 11,
    });

    expect(report.idea.name).toBe("Invoice follow-up autopilot");
    expect(report.queryBundle.problemKeywords).toEqual(["late client payments"]);
    expect(report.summary.score).toBe(66);
    expect(report.summary.range).toEqual({ lower: 55, upper: 77 });
    expect(report.methodologyVersion).toBe("0.1");
  });

  it("filters evidence through bundle exclusions and derives integrity", () => {
    const report = buildCompassReport({
      idea: {
        name: "Therapy notes",
        problem: "Therapists need note help.",
        targetUser: "Solo therapists",
        lens: "B2B Workflow / Vertical SaaS",
      },
      queryBundle: createLockedQueryBundle({
        problemKeywords: "therapist paperwork, SOAP notes",
        solutionKeywords: "session note automation",
        audienceKeywords: "solo therapists",
        competitorKeywords: "therapy notes app",
        exclusions: "physical therapy",
      }),
      evidence: therapyEvidenceSeed,
      pillarScores: therapyPillarScores,
      uncertainty: 11,
    });

    expect(report.evidence).toHaveLength(12);
    expect(report.evidence.find((item) => item.id === "physical-therapy-notes")).toMatchObject({
      included: false,
      metricContribution: "Excluded",
    });
    expect(report.integrity.finalScoreAvailable).toBe(true);
    expect(report.integrity.warnings).toEqual([]);
  });

  it("includes formula readouts for all seven pillars", () => {
    const report = buildCompassReport({
      idea: {
        name: "Therapy notes",
        problem: "Therapists need note help.",
        targetUser: "Solo therapists",
        lens: "B2B Workflow / Vertical SaaS",
      },
      queryBundle: createLockedQueryBundle({
        problemKeywords: "therapist paperwork, SOAP notes",
        solutionKeywords: "session note automation",
        audienceKeywords: "solo therapists",
        competitorKeywords: "therapy notes app",
        exclusions: "physical therapy",
      }),
      evidence: therapyEvidenceSeed,
      pillarScores: therapyPillarScores,
      uncertainty: 11,
    });

    expect(report.formulas).toHaveLength(7);
    expect(report.formulas[0]).toMatchObject({
      pillar: "Demand",
      formula: "0.45 volume + 0.25 unique authors + 0.20 questions + 0.10 engagement",
      score: 64,
    });
  });
});
