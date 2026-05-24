import {
  calculateCompassScore,
  calculateScoreRange,
  type PillarScores,
  summarizeIntegrity,
} from "../domain/scoring";

export type IdeaBrief = {
  name: string;
  problem: string;
  targetUser: string;
  lens: string;
};

export type QueryBundle = {
  version: number;
  locked: boolean;
  problemKeywords: string[];
  solutionKeywords: string[];
  audienceKeywords: string[];
  competitorKeywords: string[];
  painPhrases: string[];
  exclusions: string[];
};

export type EvidenceItem = {
  source: string;
  date: string;
  query: string;
  snippet: string;
  link: string;
  metricContribution: string;
  included: boolean;
  reason: string;
  duplicateCluster: string;
};

export type PillarSummary = {
  key: keyof PillarScores;
  label: string;
  score: number;
  note: string;
};

export type DemoReport = {
  methodologyVersion: string;
  idea: IdeaBrief;
  queryBundle: QueryBundle;
  pillars: PillarSummary[];
  summary: {
    score: number;
    uncertainty: number;
    confidence: string;
    range: {
      lower: number;
      upper: number;
    };
  };
  integrity: ReturnType<typeof summarizeIntegrity>;
  evidence: EvidenceItem[];
  strongestPillar: PillarSummary;
  weakestPillar: PillarSummary;
  interpretation: string;
  disclaimer: string;
};

const pillarScores: PillarScores = {
  demand: 64,
  pain: 82,
  momentum: 58,
  competitionFit: 66,
  activity: 49,
  channelFit: 72,
  evidenceQuality: 61,
};

const pillars: PillarSummary[] = [
  {
    key: "demand",
    label: "Demand",
    score: pillarScores.demand,
    note: "Moderate recurring discussion across reachable public sources.",
  },
  {
    key: "pain",
    label: "Pain",
    score: pillarScores.pain,
    note: "Strong repeated language around paperwork burden and after-hours notes.",
  },
  {
    key: "momentum",
    label: "Momentum",
    score: pillarScores.momentum,
    note: "Stable interest, not an obvious one-day hype spike.",
  },
  {
    key: "competitionFit",
    label: "Competition Fit",
    score: pillarScores.competitionFit,
    note: "Existing tools prove category, but specialist positioning still matters.",
  },
  {
    key: "activity",
    label: "Activity",
    score: pillarScores.activity,
    note: "Some tool activity, but not an intense open-source ecosystem.",
  },
  {
    key: "channelFit",
    label: "Channel Fit",
    score: pillarScores.channelFit,
    note: "Clear communities exist for therapist and private-practice validation.",
  },
  {
    key: "evidenceQuality",
    label: "Evidence Quality",
    score: pillarScores.evidenceQuality,
    note: "Good pain matches with some ambiguity around medical documentation.",
  },
];

function findPillar(compare: (a: PillarSummary, b: PillarSummary) => PillarSummary) {
  return pillars.reduce(compare);
}

export function createDemoReport(): DemoReport {
  const score = calculateCompassScore(pillarScores, { uncertainty: 11 });
  const range = calculateScoreRange(score);
  const strongestPillar = findPillar((best, next) =>
    next.score > best.score ? next : best,
  );
  const weakestPillar = findPillar((weakest, next) =>
    next.score < weakest.score ? next : weakest,
  );

  return {
    methodologyVersion: "0.1",
    idea: {
      name: "Privacy-safe session note drafts",
      problem:
        "Solo therapists lose unpaid time turning session context into structured notes.",
      targetUser: "Solo therapists and small private clinics",
      lens: "B2B Workflow / Vertical SaaS",
    },
    queryBundle: {
      version: 1,
      locked: true,
      problemKeywords: ["therapist paperwork", "therapy documentation", "SOAP notes"],
      solutionKeywords: ["session note drafts", "therapy note automation"],
      audienceKeywords: ["solo therapists", "private practice therapists"],
      competitorKeywords: ["therapy notes app", "EHR notes"],
      painPhrases: ["too much paperwork", "after-hours notes", "how do I reduce"],
      exclusions: ["physical therapy", "school therapy notes"],
    },
    pillars,
    summary: {
      score: score.score,
      uncertainty: score.uncertainty,
      confidence: score.confidence,
      range,
    },
    integrity: summarizeIntegrity({
      evidenceQuality: pillarScores.evidenceQuality,
      sourceDiversity: 4,
      relevancePrecision: 76,
      relevantEvidenceCount: 42,
      dominantSourceShare: 0.48,
      queryLocked: true,
    }),
    evidence: [
      {
        source: "Reddit",
        date: "2026-05-08",
        query: "therapist paperwork",
        snippet:
          "Private-practice therapists discussing documentation spilling into evenings.",
        link: "https://www.reddit.com/",
        metricContribution: "Pain",
        included: true,
        reason: "Direct pain language and matching audience.",
        duplicateCluster: "therapy-paperwork-1",
      },
      {
        source: "YouTube",
        date: "2026-04-18",
        query: "SOAP notes",
        snippet: "Tutorial demand around writing faster SOAP notes.",
        link: "https://www.youtube.com/",
        metricContribution: "Demand",
        included: true,
        reason: "Searchable education demand around the workflow.",
        duplicateCluster: "soap-notes-1",
      },
      {
        source: "Product Hunt",
        date: "2026-03-21",
        query: "therapy notes app",
        snippet: "A recent launch for clinical note workflow automation.",
        link: "https://www.producthunt.com/",
        metricContribution: "Competition Fit",
        included: true,
        reason: "Comparable product supply signal.",
        duplicateCluster: "therapy-launch-1",
      },
      {
        source: "Hacker News",
        date: "2026-02-16",
        query: "privacy therapy notes",
        snippet: "Discussion of privacy concerns around assisted clinical documentation.",
        link: "https://news.ycombinator.com/",
        metricContribution: "Evidence Quality",
        included: true,
        reason: "Relevant privacy objection for adoption risk.",
        duplicateCluster: "privacy-therapy-1",
      },
      {
        source: "Stack Exchange",
        date: "2026-01-12",
        query: "mental health notes",
        snippet: "Question around structured documentation practices.",
        link: "https://stackexchange.com/",
        metricContribution: "Channel Fit",
        included: true,
        reason: "Professional workflow question with matching terminology.",
        duplicateCluster: "documentation-question-1",
      },
      {
        source: "Reddit",
        date: "2026-05-02",
        query: "therapy notes",
        snippet: "Physical therapy treatment notes workflow discussion.",
        link: "https://www.reddit.com/",
        metricContribution: "Excluded",
        included: false,
        reason: "Excluded because it matched physical therapy, not mental health therapy.",
        duplicateCluster: "excluded-physical-therapy-1",
      },
    ],
    strongestPillar,
    weakestPillar,
    interpretation:
      "Public evidence supports deeper validation. Pain appears strong, while activity data remains thinner.",
    disclaimer:
      "This score reflects public evidence found through selected sources and queries. It is not a prediction of success, customer willingness to pay, or product quality.",
  };
}
