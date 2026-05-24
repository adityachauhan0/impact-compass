import { describe, expect, it } from "vitest";
import { createLockedQueryBundle } from "../domain/queryBundle";
import { buildCompassReport } from "./reportBuilder";
import { buildComparisonRows, buildSnapshotComparisonRows } from "./comparison";
import { createReportSnapshot } from "./reportStorage";
import { therapyEvidenceSeed, therapyPillarScores } from "./therapySeed";

function report(name: string, scoreShape: typeof therapyPillarScores, uncertainty: number) {
  return buildCompassReport({
    idea: {
      name,
      problem: `${name} problem`,
      targetUser: "Indie builders",
      lens: "Productivity / Prosumer SaaS",
    },
    queryBundle: createLockedQueryBundle({
      problemKeywords: name,
      solutionKeywords: `${name} tool`,
      audienceKeywords: "indie builders",
      competitorKeywords: "",
      exclusions: "jobs",
    }),
    evidence: therapyEvidenceSeed,
    pillarScores: scoreShape,
    uncertainty,
  });
}

describe("comparison service", () => {
  it("ranks reports by lower confidence bound", () => {
    const rows = buildComparisonRows([
      report(
        "Spiky high score",
        { ...therapyPillarScores, demand: 95, pain: 95, evidenceQuality: 70 },
        25,
      ),
      report(
        "Steady evidence",
        { ...therapyPillarScores, demand: 72, pain: 74, evidenceQuality: 80 },
        6,
      ),
    ]);

    expect(rows.map((row) => row.ideaName)).toEqual([
      "Steady evidence",
      "Spiky high score",
    ]);
    expect(rows[0].rankBasis).toBeGreaterThan(rows[1].rankBasis);
  });

  it("includes comparison diagnostics for each idea", () => {
    const rows = buildComparisonRows([
      report("Therapy notes", therapyPillarScores, 11),
    ]);

    expect(rows[0]).toMatchObject({
      ideaName: "Therapy notes",
      strongestPillar: "Pain",
      weakestPillar: "Activity",
      bestChannel: "Reddit",
    });
  });

  it("ranks saved snapshots without seeded fake alternatives", () => {
    const rows = buildSnapshotComparisonRows([
      createReportSnapshot(
        report(
          "Spiky high score",
          { ...therapyPillarScores, demand: 95, pain: 95, evidenceQuality: 70 },
          25,
        ),
        "2026-05-24T04:00:00.000Z",
      ),
      createReportSnapshot(
        report(
          "Steady evidence",
          { ...therapyPillarScores, demand: 72, pain: 74, evidenceQuality: 80 },
          6,
        ),
        "2026-05-24T05:00:00.000Z",
      ),
    ]);

    expect(rows.map((row) => row.ideaName)).toEqual([
      "Steady evidence",
      "Spiky high score",
    ]);
  });
});
