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
    formulaLatex:
      "0.45V + 0.25A_u + 0.20Q_i + 0.10E_p",
    inputs: ["mention volume", "unique authors", "question intent", "engagement percentile"],
  },
  {
    pillar: "Pain",
    formula:
      "0.35 pain density + 0.25 workaround density + 0.20 alternative density + 0.20 discussion depth",
    formulaLatex:
      "0.35D_p + 0.25D_w + 0.20D_a + 0.20D_d",
    inputs: ["pain phrases", "workarounds", "alternative seeking", "discussion depth"],
  },
  {
    pillar: "Momentum",
    formula: "0.40 short growth + 0.30 medium growth + 0.20 sustained growth - 0.10 spike penalty",
    formulaLatex:
      "0.40G_{30} + 0.30G_{90} + 0.20G_s - 0.10P_{spike}",
    inputs: ["30-day rate", "90-day rate", "sustained trend", "spike penalty"],
  },
  {
    pillar: "Competition Fit",
    formula: "100 * exp(-((supply percentile - 60)^2) / (2 * 25^2))",
    formulaLatex:
      "100e^{-\\frac{(P_s - 60)^2}{2 \\cdot 25^2}}",
    inputs: ["competitor count", "launch count", "repo/package supply", "saturation penalty"],
  },
  {
    pillar: "Activity",
    formula: "weighted available activity signals; non-relevant missing metrics excluded",
    formulaLatex:
      "\\frac{\\sum w_i s_i}{\\sum w_i}",
    inputs: ["repo activity", "package activity", "launch recency", "discussion freshness"],
  },
  {
    pillar: "Channel Fit",
    formula: "0.35 concentration + 0.25 community count + 0.25 engagement + 0.15 lens match",
    formulaLatex:
      "0.35C_s + 0.25C_n + 0.25E_c + 0.15L_m",
    inputs: ["source concentration", "community count", "top channel engagement", "lens match"],
  },
  {
    pillar: "Evidence Quality",
    formula:
      "0.25 source diversity + 0.20 sample size + 0.20 precision + 0.15 ambiguity inverse + 0.10 duplicate inverse + 0.10 recency coverage",
    formulaLatex:
      "0.25D_s + 0.20N + 0.20R_p + 0.15A_i + 0.10D_i + 0.10R_c",
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

function generateInterpretation(
  score: number,
  strongest: PillarSummary,
  weakest: PillarSummary,
  compFit: number
): string {
  let interpretation = "";
  
  if (score >= 90) {
    interpretation = "This idea is highly validated. Public evidence shows exceptional product-market potential. ";
  } else if (score >= 70) {
    interpretation = "Public evidence supports deeper validation. The idea shows strong promise but faces some friction. ";
  } else if (score >= 50) {
    interpretation = "The idea has moderate validation. There are signals of demand, but it may require a pivot or niche targeting. ";
  } else {
    interpretation = "Public evidence is currently lacking. This market may be too small, or the problem is not widely discussed online. ";
  }

  if (compFit <= 30) {
    interpretation += "WARNING: This is a highly saturated Red Ocean market with massive existing competition. ";
  } else if (compFit >= 80) {
    interpretation += "Excitingly, there appears to be very little direct competition (Blue Ocean). ";
  }

  interpretation += `Your strongest validation signal is ${strongest.label}, while ${weakest.label} remains the weakest link.`;

  return interpretation;
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
    interpretation: generateInterpretation(score.score, strongestPillar, weakestPillar, input.pillarScores.competitionFit),
    disclaimer:
      "This score reflects public evidence found through selected sources and queries. It is not a prediction of success, customer willingness to pay, or product quality.",
  };
}
