import { describe, expect, it } from "vitest";
import {
  calculateEvidenceIntegrity,
  filterEvidenceForBundle,
  type EvidenceItem,
} from "./evidence";
import { createLockedQueryBundle } from "./queryBundle";

const evidence: EvidenceItem[] = [
  {
    id: "pain-1",
    source: "Reddit",
    sourceType: "post",
    date: "2026-05-08",
    query: "therapist paperwork",
    snippet: "Therapists mention too much paperwork after sessions.",
    link: "https://www.reddit.com/",
    metricContribution: "Pain",
    included: true,
    reason: "Seed inclusion",
    duplicateCluster: "paperwork-1",
    signalStrength: 82,
  },
  {
    id: "excluded-1",
    source: "Reddit",
    sourceType: "post",
    date: "2026-05-02",
    query: "therapy notes",
    snippet: "Physical therapy treatment notes workflow.",
    link: "https://www.reddit.com/",
    metricContribution: "Demand",
    included: true,
    reason: "Seed inclusion",
    duplicateCluster: "physical-1",
    signalStrength: 40,
  },
  {
    id: "demand-1",
    source: "YouTube",
    sourceType: "video",
    date: "2026-04-18",
    query: "SOAP notes",
    snippet: "Tutorial demand around writing faster SOAP notes.",
    link: "https://www.youtube.com/",
    metricContribution: "Demand",
    included: true,
    reason: "Seed inclusion",
    duplicateCluster: "soap-1",
    signalStrength: 64,
  },
];

describe("evidence domain", () => {
  it("marks evidence excluded when it hits bundle exclusions", () => {
    const bundle = createLockedQueryBundle({
      problemKeywords: "therapist paperwork, SOAP notes",
      solutionKeywords: "session note automation",
      audienceKeywords: "solo therapists",
      competitorKeywords: "",
      exclusions: "physical therapy",
    });

    const filtered = filterEvidenceForBundle(evidence, bundle);

    expect(filtered.find((item) => item.id === "excluded-1")).toMatchObject({
      included: false,
      metricContribution: "Excluded",
      reason: "Excluded by query bundle term: physical therapy.",
    });
    expect(filtered.find((item) => item.id === "pain-1")?.included).toBe(true);
  });

  it("calculates integrity inputs from included evidence only", () => {
    const integrity = calculateEvidenceIntegrity(
      filterEvidenceForBundle(
        evidence,
        createLockedQueryBundle({
          problemKeywords: "therapist paperwork, SOAP notes",
          solutionKeywords: "session note automation",
          audienceKeywords: "solo therapists",
          competitorKeywords: "",
          exclusions: "physical therapy",
        }),
      ),
    );

    expect(integrity.sourceDiversity).toBe(2);
    expect(integrity.relevantEvidenceCount).toBe(2);
    expect(integrity.dominantSourceShare).toBe(0.5);
    expect(integrity.relevancePrecision).toBe(67);
  });
});
