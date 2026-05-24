import { describe, expect, it } from "vitest";
import {
  createLockedQueryBundle,
  evaluateQueryQuality,
  parseTermList,
} from "./queryBundle";

describe("query bundle domain", () => {
  it("parses comma and newline separated terms without duplicates", () => {
    expect(
      parseTermList("therapist paperwork, SOAP notes\nsoap notes; therapy docs,, "),
    ).toEqual(["therapist paperwork", "SOAP notes", "therapy docs"]);
  });

  it("creates an immutable locked query bundle from editable form fields", () => {
    const bundle = createLockedQueryBundle({
      problemKeywords: "invoice follow up, late payments",
      solutionKeywords: "invoice reminder automation",
      audienceKeywords: "freelancers, consultants",
      competitorKeywords: "HoneyBook alternative",
      exclusions: "medical billing",
    });

    expect(bundle).toMatchObject({
      version: 1,
      locked: true,
      problemKeywords: ["invoice follow up", "late payments"],
      solutionKeywords: ["invoice reminder automation"],
      audienceKeywords: ["freelancers", "consultants"],
      competitorKeywords: ["HoneyBook alternative"],
      exclusions: ["medical billing"],
    });
    expect(bundle.painPhrases).toContain("manual process");
  });

  it("labels a focused bundle with exclusions as strong", () => {
    const quality = evaluateQueryQuality(
      createLockedQueryBundle({
        problemKeywords: "therapist paperwork, SOAP notes",
        solutionKeywords: "session note automation",
        audienceKeywords: "solo therapists",
        competitorKeywords: "EHR notes",
        exclusions: "physical therapy",
      }),
    );

    expect(quality.label).toBe("Strong");
    expect(quality.warning).toBe(
      "Ambiguity controlled with audience terms and exclusions.",
    );
  });

  it("flags broad bundles with weak precision", () => {
    const quality = evaluateQueryQuality(
      createLockedQueryBundle({
        problemKeywords: "AI",
        solutionKeywords: "",
        audienceKeywords: "",
        competitorKeywords: "",
        exclusions: "",
      }),
    );

    expect(quality.label).toBe("Too broad");
    expect(quality.warning).toBe("Add audience terms and exclusions before scoring.");
  });
});
