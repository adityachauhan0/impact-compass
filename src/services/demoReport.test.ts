import { describe, expect, it } from "vitest";
import { createDemoReport } from "./demoReport";

describe("demo report fixture", () => {
  it("builds a locked public-evidence report from deterministic scoring", () => {
    const report = createDemoReport();

    expect(report.idea.name).toBe("Privacy-safe session note drafts");
    expect(report.queryBundle.locked).toBe(true);
    expect(report.methodologyVersion).toBe("0.1");
    expect(report.summary.score).toBe(66);
    expect(report.summary.uncertainty).toBe(11);
    expect(report.summary.confidence).toBe("Medium");
    expect(report.summary.range).toEqual({ lower: 55, upper: 77 });
    expect(report.integrity.finalScoreAvailable).toBe(true);
  });

  it("keeps evidence ledger entries auditable", () => {
    const report = createDemoReport();

    expect(report.evidence).toHaveLength(12);
    expect(report.evidence.some((item) => item.included)).toBe(true);
    expect(report.evidence.some((item) => !item.included)).toBe(true);
    expect(report.evidence[0]).toMatchObject({
      source: "Reddit",
      metricContribution: "Pain",
      query: "therapist paperwork",
    });
  });

  it("identifies strongest and weakest pillars", () => {
    const report = createDemoReport();

    expect(report.strongestPillar.label).toBe("Pain");
    expect(report.weakestPillar.label).toBe("Activity");
  });
});
