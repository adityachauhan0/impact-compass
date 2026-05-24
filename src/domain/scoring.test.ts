import { describe, expect, it } from "vitest";
import {
  calculateCompassScore,
  calculateConfidence,
  calculateActivityScore,
  calculateCompetitionFitScore,
  calculateDemandScore,
  calculateMomentumScore,
  calculatePainScore,
  calculateRecencyWeight,
  calculateScoreRange,
  rankIdeasByEvidence,
  summarizeIntegrity,
} from "./scoring";

const balancedPillars = {
  demand: 70,
  pain: 80,
  momentum: 60,
  competitionFit: 65,
  activity: 50,
  channelFit: 75,
  evidenceQuality: 60,
};

describe("scoring methodology", () => {
  it("calculates the Compass Score as a weighted pillar average", () => {
    const result = calculateCompassScore(balancedPillars);

    expect(result.score).toBe(67);
    expect(result.weights).toEqual({
      demand: 20,
      pain: 20,
      momentum: 15,
      competitionFit: 15,
      activity: 10,
      channelFit: 10,
      evidenceQuality: 10,
    });
  });

  it("keeps uncertainty separate from the Compass Score", () => {
    const highUncertainty = calculateCompassScore(balancedPillars, {
      uncertainty: 22,
    });
    const lowUncertainty = calculateCompassScore(balancedPillars, {
      uncertainty: 6,
    });

    expect(highUncertainty.score).toBe(lowUncertainty.score);
    expect(highUncertainty.uncertainty).toBe(22);
    expect(lowUncertainty.uncertainty).toBe(6);
  });

  it("maps uncertainty bands to confidence labels", () => {
    expect(calculateConfidence(7)).toBe("High");
    expect(calculateConfidence(14)).toBe("Medium");
    expect(calculateConfidence(24)).toBe("Low");
    expect(calculateConfidence(25)).toBe("Very Low");
  });

  it("clamps score ranges to 0-100", () => {
    expect(calculateScoreRange({ score: 96, uncertainty: 9 })).toEqual({
      lower: 87,
      upper: 100,
    });
    expect(calculateScoreRange({ score: 4, uncertainty: 10 })).toEqual({
      lower: 0,
      upper: 14,
    });
  });

  it("ranks ideas by lower confidence bound, not raw score", () => {
    const ranked = rankIdeasByEvidence([
      { id: "spiky", name: "Spiky idea", score: 74, uncertainty: 18 },
      { id: "steady", name: "Steady idea", score: 69, uncertainty: 5 },
    ]);

    expect(ranked.map((idea) => idea.id)).toEqual(["steady", "spiky"]);
    expect(ranked[0].rankBasis).toBe(64);
    expect(ranked[1].rankBasis).toBe(56);
  });

  it("summarizes integrity caps when evidence quality is weak", () => {
    const integrity = summarizeIntegrity({
      evidenceQuality: 38,
      sourceDiversity: 4,
      relevancePrecision: 72,
      relevantEvidenceCount: 50,
      dominantSourceShare: 0.42,
      queryLocked: true,
    });

    expect(integrity.finalScoreAvailable).toBe(true);
    expect(integrity.confidenceCap).toBe("Low");
    expect(integrity.warnings).toContain(
      "Evidence Quality below 40 caps confidence at Low.",
    );
  });

  it("withholds final score when query bundle is not locked", () => {
    const integrity = summarizeIntegrity({
      evidenceQuality: 80,
      sourceDiversity: 5,
      relevancePrecision: 90,
      relevantEvidenceCount: 100,
      dominantSourceShare: 0.4,
      queryLocked: false,
    });

    expect(integrity.finalScoreAvailable).toBe(false);
    expect(integrity.warnings).toContain(
      "Query bundle is not locked; only preview scoring is allowed.",
    );
  });

  it("uses deterministic recency weight boundaries", () => {
    expect(calculateRecencyWeight(0)).toBe(1);
    expect(calculateRecencyWeight(30)).toBe(1);
    expect(calculateRecencyWeight(31)).toBe(0.75);
    expect(calculateRecencyWeight(90)).toBe(0.75);
    expect(calculateRecencyWeight(91)).toBe(0.45);
    expect(calculateRecencyWeight(365)).toBe(0.45);
    expect(calculateRecencyWeight(366)).toBe(0.2);
  });

  it("calculates Demand from weighted normalized signals", () => {
    expect(
      calculateDemandScore({
        volumePercentile: 80,
        uniqueAuthorPercentile: 60,
        questionPercentile: 70,
        engagementPercentile: 50,
      }),
    ).toBe(70);
  });

  it("calculates Pain from weighted normalized signals", () => {
    expect(
      calculatePainScore({
        painDensity: 90,
        workaroundDensity: 80,
        alternativeDensity: 50,
        discussionDepthPercentile: 40,
      }),
    ).toBe(70);
  });

  it("clamps Momentum after spike penalties", () => {
    expect(
      calculateMomentumScore({
        shortGrowth: 100,
        mediumGrowth: 100,
        sustainedGrowth: 100,
        spikePenalty: 500,
      }),
    ).toBe(40);
    expect(
      calculateMomentumScore({
        shortGrowth: 0,
        mediumGrowth: 0,
        sustainedGrowth: 0,
        spikePenalty: 500,
      }),
    ).toBe(0);
  });

  it("scores Competition Fit highest near moderate supply", () => {
    expect(calculateCompetitionFitScore(60)).toBe(100);
    expect(calculateCompetitionFitScore(0)).toBe(6);
    expect(calculateCompetitionFitScore(100)).toBe(28);
  });

  it("excludes non-relevant Activity metrics instead of treating them as zero", () => {
    expect(
      calculateActivityScore({
        repoActivity: 80,
        packageActivity: null,
        launchRecency: 60,
        discussionFreshness: 70,
      }),
    ).toBe(72);
  });
});
