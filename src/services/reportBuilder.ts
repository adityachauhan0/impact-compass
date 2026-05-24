import {
  calculateEvidenceIntegrity,
  filterEvidenceForBundle,
  type EvidenceItem,
} from "../domain/evidence";
import { evaluateQueryQuality, type QueryBundle } from "../domain/queryBundle";
import {
  calculateCompassScore,
  calculateScoreRange,
  type PillarScores,
  summarizeIntegrity,
} from "../domain/scoring";
import type {
  CompassReportModel,
  FormulaReadout,
  IdeaBrief,
  PillarSummary,
} from "./reportTypes";

export type BuildCompassReportInput = {
  idea: IdeaBrief;
  queryBundle: QueryBundle;
  evidence: EvidenceItem[];
  pillarScores: PillarScores;
  uncertainty?: number;
  methodologyVersion?: string;
};

const pillarLabels: Record<keyof PillarScores, string> = {
  demand: "Demand",
  pain: "Pain",
  momentum: "Momentum",
  competitionFit: "Competition Fit",
  activity: "Activity",
  channelFit: "Channel Fit",
  evidenceQuality: "Evidence Quality",
};

const formulas: Omit<FormulaReadout, "score">[] = [
  {
    pillar: "Demand",
    formula: "0.45 volume + 0.25 unique authors + 0.20 questions + 0.10 engagement",
    inputs: ["mention volume", "unique authors", "question intent", "engagement percentile"],
  },
  {
    pillar: "Pain",
    formula:
      "0.35 pain density + 0.25 workaround density + 0.20 alternative density + 0.20 discussion depth",
    inputs: ["pain phrases", "workarounds", "alternative seeking", "discussion depth"],
  },
  {
    pillar: "Momentum",
    formula: "0.40 short growth + 0.30 medium growth + 0.20 sustained growth - 0.10 spike penalty",
    inputs: ["30-day rate", "90-day rate", "sustained trend", "spike penalty"],
  },
  {
    pillar: "Competition Fit",
    formula: "100 * exp(-((supply percentile - 60)^2) / (2 * 25^2))",
    inputs: ["competitor count", "launch count", "repo/package supply", "saturation penalty"],
  },
  {
    pillar: "Activity",
    formula: "weighted available activity signals; non-relevant missing metrics excluded",
    inputs: ["repo activity", "package activity", "launch recency", "discussion freshness"],
  },
  {
    pillar: "Channel Fit",
    formula: "0.35 concentration + 0.25 community count + 0.25 engagement + 0.15 lens match",
    inputs: ["source concentration", "community count", "top channel engagement", "lens match"],
  },
  {
    pillar: "Evidence Quality",
    formula:
      "0.25 source diversity + 0.20 sample size + 0.20 precision + 0.15 ambiguity inverse + 0.10 duplicate inverse + 0.10 recency coverage",
    inputs: ["source diversity", "sample size", "precision", "ambiguity", "duplicates", "recency"],
  },
];

function firstTerm(terms: string[], fallback: string) {
  return terms[0] ?? fallback;
}

function createPillarNotes(input: BuildCompassReportInput): Record<keyof PillarScores, string> {
  const problem = firstTerm(input.queryBundle.problemKeywords, input.idea.problem);
  const solution = firstTerm(input.queryBundle.solutionKeywords, input.idea.name);
  const audience = firstTerm(input.queryBundle.audienceKeywords, input.idea.targetUser);
  const competitor = firstTerm(
    input.queryBundle.competitorKeywords,
    `${input.idea.name} alternatives`,
  );

  return {
    demand: `Demand reads public-search targets for "${problem}" across free sources.`,
    pain: `Pain reads workaround and complaint language around "${problem}".`,
    momentum: `Momentum reads recent public activity around "${solution}".`,
    competitionFit: `Competition Fit compares visible alternatives such as "${competitor}".`,
    activity: `Activity reads builder and package signals around "${solution}".`,
    channelFit: `Channel Fit checks whether "${audience}" has reachable public communities.`,
    evidenceQuality: "Evidence Quality rewards source diversity, exclusions, and query specificity.",
  };
}

function createPillars(input: BuildCompassReportInput): PillarSummary[] {
  const pillarNotes = createPillarNotes(input);

  return (Object.keys(input.pillarScores) as Array<keyof PillarScores>).map((key) => ({
    key,
    label: pillarLabels[key],
    score: input.pillarScores[key],
    note: pillarNotes[key],
  }));
}

function findPillar(
  pillars: PillarSummary[],
  compare: (a: PillarSummary, b: PillarSummary) => PillarSummary,
) {
  return pillars.reduce(compare);
}

function createFormulaReadouts(pillarScores: PillarScores): FormulaReadout[] {
  const scoreByLabel = Object.fromEntries(
    Object.entries(pillarLabels).map(([key, label]) => [
      label,
      pillarScores[key as keyof PillarScores],
    ]),
  );

  return formulas.map((formula) => ({
    ...formula,
    score: scoreByLabel[formula.pillar],
  }));
}

export function buildCompassReport(
  input: BuildCompassReportInput,
): CompassReportModel {
  const evidence = filterEvidenceForBundle(input.evidence, input.queryBundle);
  const evidenceIntegrity = calculateEvidenceIntegrity(evidence);
  const score = calculateCompassScore(input.pillarScores, {
    uncertainty: input.uncertainty ?? 10,
  });
  const pillars = createPillars(input);
  const strongestPillar = findPillar(pillars, (best, next) =>
    next.score > best.score ? next : best,
  );
  const weakestPillar = findPillar(pillars, (weakest, next) =>
    next.score < weakest.score ? next : weakest,
  );

  return {
    methodologyVersion: input.methodologyVersion ?? "0.1",
    idea: input.idea,
    queryBundle: input.queryBundle,
    queryQuality: evaluateQueryQuality(input.queryBundle),
    pillars,
    formulas: createFormulaReadouts(input.pillarScores),
    summary: {
      score: score.score,
      uncertainty: score.uncertainty,
      confidence: score.confidence,
      range: calculateScoreRange(score),
    },
    integrity: summarizeIntegrity({
      evidenceQuality: input.pillarScores.evidenceQuality,
      queryLocked: input.queryBundle.locked,
      ...evidenceIntegrity,
    }),
    evidence,
    strongestPillar,
    weakestPillar,
    interpretation:
      "Public evidence supports deeper validation. Pain appears strong, while activity data remains thinner.",
    disclaimer:
      "This score reflects public evidence found through selected sources and queries. It is not a prediction of success, customer willingness to pay, or product quality.",
  };
}
