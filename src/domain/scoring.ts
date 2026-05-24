export type ConfidenceLabel = "Very Low" | "Low" | "Medium" | "High";

export type PillarScores = {
  demand: number;
  pain: number;
  momentum: number;
  competitionFit: number;
  activity: number;
  channelFit: number;
  evidenceQuality: number;
};

export type ScoreWeights = Record<keyof PillarScores, number>;

export type ScoreSummary = {
  score: number;
  uncertainty: number;
  confidence: ConfidenceLabel;
  weights: ScoreWeights;
};

export type RankedIdea = {
  id: string;
  name: string;
  score: number;
  uncertainty: number;
};

export type RankedIdeaWithBasis = RankedIdea & {
  rankBasis: number;
  lower: number;
  upper: number;
};

export type IntegrityInput = {
  evidenceQuality: number;
  sourceDiversity: number;
  relevancePrecision: number;
  relevantEvidenceCount: number;
  dominantSourceShare: number;
  queryLocked: boolean;
};

export type IntegritySummary = {
  finalScoreAvailable: boolean;
  confidenceCap?: ConfidenceLabel;
  warnings: string[];
};

export type DemandSignals = {
  volumePercentile: number;
  uniqueAuthorPercentile: number;
  questionPercentile: number;
  engagementPercentile: number;
};

export type PainSignals = {
  painDensity: number;
  workaroundDensity: number;
  alternativeDensity: number;
  discussionDepthPercentile: number;
};

export type MomentumSignals = {
  shortGrowth: number;
  mediumGrowth: number;
  sustainedGrowth: number;
  spikePenalty: number;
};

export type ActivitySignals = {
  repoActivity: number | null;
  packageActivity: number | null;
  launchRecency: number | null;
  discussionFreshness: number | null;
};

export const defaultWeights: ScoreWeights = {
  demand: 20,
  pain: 20,
  momentum: 15,
  competitionFit: 15,
  activity: 10,
  channelFit: 10,
  evidenceQuality: 10,
};

const minimumEvidenceCount = 10;

function clampScore(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function weightedAverage<T extends string>(
  signals: Record<T, number | null>,
  weights: Record<T, number>,
) {
  let weightedTotal = 0;
  let totalWeight = 0;

  for (const key of Object.keys(weights) as T[]) {
    const value = signals[key];

    if (value === null) {
      continue;
    }

    weightedTotal += value * weights[key];
    totalWeight += weights[key];
  }

  return totalWeight === 0 ? 0 : weightedTotal / totalWeight;
}

function lowestConfidenceCap(
  current: ConfidenceLabel | undefined,
  next: ConfidenceLabel,
) {
  const order: ConfidenceLabel[] = ["Very Low", "Low", "Medium", "High"];

  if (!current) {
    return next;
  }

  return order.indexOf(next) < order.indexOf(current) ? next : current;
}

export function calculateConfidence(uncertainty: number): ConfidenceLabel {
  if (uncertainty <= 7) {
    return "High";
  }

  if (uncertainty <= 14) {
    return "Medium";
  }

  if (uncertainty <= 24) {
    return "Low";
  }

  return "Very Low";
}

export function calculateScoreRange(params: { score: number; uncertainty: number }) {
  return {
    lower: clampScore(params.score - params.uncertainty),
    upper: clampScore(params.score + params.uncertainty),
  };
}

export function calculateRecencyWeight(ageInDays: number) {
  if (ageInDays <= 30) {
    return 1;
  }

  if (ageInDays <= 90) {
    return 0.75;
  }

  if (ageInDays <= 365) {
    return 0.45;
  }

  return 0.2;
}

export function calculateDemandScore(signals: DemandSignals) {
  return clampScore(
    weightedAverage(
      {
        volumePercentile: signals.volumePercentile,
        uniqueAuthorPercentile: signals.uniqueAuthorPercentile,
        questionPercentile: signals.questionPercentile,
        engagementPercentile: signals.engagementPercentile,
      },
      {
        volumePercentile: 0.45,
        uniqueAuthorPercentile: 0.25,
        questionPercentile: 0.2,
        engagementPercentile: 0.1,
      },
    ),
  );
}

export function calculatePainScore(signals: PainSignals) {
  return clampScore(
    weightedAverage(
      {
        painDensity: signals.painDensity,
        workaroundDensity: signals.workaroundDensity,
        alternativeDensity: signals.alternativeDensity,
        discussionDepthPercentile: signals.discussionDepthPercentile,
      },
      {
        painDensity: 0.35,
        workaroundDensity: 0.25,
        alternativeDensity: 0.2,
        discussionDepthPercentile: 0.2,
      },
    ),
  );
}

export function calculateMomentumScore(signals: MomentumSignals) {
  return clampScore(
    0.4 * signals.shortGrowth +
      0.3 * signals.mediumGrowth +
      0.2 * signals.sustainedGrowth -
      0.1 * signals.spikePenalty,
  );
}

export function calculateCompetitionFitScore(supplyPercentile: number) {
  const variance = 2 * 25 ** 2;
  const rawScore = 100 * Math.exp(-((supplyPercentile - 60) ** 2) / variance);

  return clampScore(rawScore);
}

export function calculateActivityScore(signals: ActivitySignals) {
  return clampScore(
    weightedAverage(
      {
        repoActivity: signals.repoActivity,
        packageActivity: signals.packageActivity,
        launchRecency: signals.launchRecency,
        discussionFreshness: signals.discussionFreshness,
      },
      {
        repoActivity: 0.35,
        packageActivity: 0.25,
        launchRecency: 0.2,
        discussionFreshness: 0.2,
      },
    ),
  );
}

export function calculateCompassScore(
  pillars: PillarScores,
  options: { uncertainty?: number; weights?: ScoreWeights } = {},
): ScoreSummary {
  const weights = options.weights ?? defaultWeights;
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  let weightedScore =
    Object.entries(weights).reduce((sum, [pillar, weight]) => {
      return sum + pillars[pillar as keyof PillarScores] * weight;
    }, 0) / totalWeight;
  const uncertainty = options.uncertainty ?? 10;

  // Red Ocean Saturation Penalty
  // High demand but very low Competition Fit (meaning massive competition volume)
  let saturationPenalty = 0;
  if (pillars.demand > 70 && pillars.competitionFit < 30) {
    // Dock up to 15 extra points for extreme saturation
    saturationPenalty = (30 - pillars.competitionFit) * 0.5;
  }
  
  weightedScore -= saturationPenalty;

  return {
    score: clampScore(weightedScore),
    uncertainty,
    confidence: calculateConfidence(uncertainty),
    weights,
  };
}

export function rankIdeasByEvidence(ideas: RankedIdea[]): RankedIdeaWithBasis[] {
  return ideas
    .map((idea) => {
      const range = calculateScoreRange(idea);

      return {
        ...idea,
        ...range,
        rankBasis: range.lower,
      };
    })
    .sort((a, b) => b.rankBasis - a.rankBasis || b.score - a.score);
}

export function summarizeIntegrity(input: IntegrityInput): IntegritySummary {
  const warnings: string[] = [];
  let confidenceCap: ConfidenceLabel | undefined;

  if (!input.queryLocked) {
    warnings.push("Query bundle is not locked; only preview scoring is allowed.");
  }

  if (input.evidenceQuality < 40) {
    warnings.push("Evidence Quality below 40 caps confidence at Low.");
    confidenceCap = lowestConfidenceCap(confidenceCap, "Low");
  }

  if (input.sourceDiversity < 2) {
    warnings.push("Source diversity below 2 caps confidence at Low.");
    confidenceCap = lowestConfidenceCap(confidenceCap, "Low");
  }

  if (input.relevancePrecision < 50) {
    warnings.push("Relevance precision below 50 caps confidence at Low.");
    confidenceCap = lowestConfidenceCap(confidenceCap, "Low");
  }

  if (input.relevantEvidenceCount < minimumEvidenceCount) {
    warnings.push("Relevant evidence count is below the minimum confidence threshold.");
    confidenceCap = lowestConfidenceCap(confidenceCap, "Low");
  }

  if (input.dominantSourceShare > 0.7) {
    warnings.push("One source contributes over 70% of evidence; confidence caps at Medium.");
    confidenceCap = lowestConfidenceCap(confidenceCap, "Medium");
  }

  return {
    finalScoreAvailable: input.queryLocked,
    confidenceCap,
    warnings,
  };
}
