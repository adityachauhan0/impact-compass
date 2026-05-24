import type { EvidenceItem, EvidenceSource, MetricContribution, SourceType } from "../domain/evidence";
import type { QueryBundle } from "../domain/queryBundle";
import type { PillarScores } from "../domain/scoring";
import type { IdeaBrief } from "./reportTypes";

type EvidenceDraft = {
  source: EvidenceSource;
  sourceType: SourceType;
  query: string;
  snippet: string;
  link: string;
  metricContribution: MetricContribution;
  reason: string;
  signalStrength: number;
};

const generatedDate = "2026-05-24";

function primary(terms: string[], fallback: string) {
  return terms[0] ?? fallback;
}

function searchUrl(base: string, query: string) {
  return `${base}${encodeURIComponent(query)}`;
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function sourceTermScore(termCount: number, bonus: number) {
  return clamp(38 + termCount * 11 + bonus);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return clamp(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function scoreByContribution(
  evidence: EvidenceItem[],
  contribution: MetricContribution,
) {
  return average(
    evidence
      .filter((item) => item.included && item.metricContribution === contribution)
      .map((item) => item.signalStrength),
  );
}

export function createQueryDerivedEvidence(
  idea: IdeaBrief,
  bundle: QueryBundle,
): EvidenceItem[] {
  const problem = primary(bundle.problemKeywords, idea.problem);
  const solution = primary(bundle.solutionKeywords, idea.name);
  const audience = primary(bundle.audienceKeywords, idea.targetUser);
  const competitor = primary(bundle.competitorKeywords, `${idea.name} alternative`);
  const exclusion = primary(bundle.exclusions, "wrong meaning");
  const specificity =
    bundle.problemKeywords.length +
    bundle.solutionKeywords.length +
    bundle.audienceKeywords.length +
    bundle.competitorKeywords.length;
  const audienceBonus = bundle.audienceKeywords.length > 0 ? 8 : 0;
  const exclusionBonus = bundle.exclusions.length > 0 ? 6 : 0;
  const drafts: EvidenceDraft[] = [
    {
      source: "Reddit",
      sourceType: "post",
      query: problem,
      snippet: `Reddit public-search target for "${problem}" and "${audience}".`,
      link: searchUrl("https://www.reddit.com/search/?q=", `${problem} ${audience}`),
      metricContribution: "Demand",
      reason: "Generated from the locked problem and audience terms.",
      signalStrength: sourceTermScore(bundle.problemKeywords.length, audienceBonus),
    },
    {
      source: "YouTube",
      sourceType: "video",
      query: solution,
      snippet: `YouTube public-search target for "${solution}" tutorials, reviews, and workflows.`,
      link: searchUrl("https://www.youtube.com/results?search_query=", solution),
      metricContribution: "Demand",
      reason: "Generated from the locked solution terms.",
      signalStrength: sourceTermScore(bundle.solutionKeywords.length, 4),
    },
    {
      source: "Hacker News",
      sourceType: "comment",
      query: `${problem} workaround`,
      snippet: `Hacker News search target for workaround language around "${problem}".`,
      link: searchUrl("https://hn.algolia.com/?q=", `${problem} workaround`),
      metricContribution: "Pain",
      reason: "Uses problem terms plus pain/workaround phrasing.",
      signalStrength: sourceTermScore(bundle.problemKeywords.length, 14),
    },
    {
      source: "Product Hunt",
      sourceType: "launch",
      query: competitor,
      snippet: `Product Hunt search target for comparable launches: "${competitor}".`,
      link: searchUrl("https://www.producthunt.com/search?q=", competitor),
      metricContribution: "Competition Fit",
      reason: "Generated from locked competitor terms.",
      signalStrength: sourceTermScore(bundle.competitorKeywords.length, 10),
    },
    {
      source: "GitHub",
      sourceType: "repo",
      query: solution,
      snippet: `GitHub public-search target for repositories matching "${solution}".`,
      link: searchUrl("https://github.com/search?q=", solution),
      metricContribution: "Activity",
      reason: "Generated from locked solution terms as a free-source activity target.",
      signalStrength: sourceTermScore(bundle.solutionKeywords.length, 0),
    },
    {
      source: "Stack Exchange",
      sourceType: "question",
      query: audience,
      snippet: `Stack Exchange search target for questions from or about "${audience}".`,
      link: searchUrl("https://stackexchange.com/search?q=", audience),
      metricContribution: "Channel Fit",
      reason: "Generated from locked audience terms.",
      signalStrength: sourceTermScore(bundle.audienceKeywords.length, 12),
    },
    {
      source: "npm",
      sourceType: "package",
      query: solution,
      snippet: `npm package-search target for builder activity around "${solution}".`,
      link: searchUrl("https://www.npmjs.com/search?q=", solution),
      metricContribution: "Momentum",
      reason: "Generated from locked solution terms and free package-search surface.",
      signalStrength: sourceTermScore(specificity, 2),
    },
    {
      source: "Hacker News",
      sourceType: "post",
      query: `${problem} ${solution}`,
      snippet: `Cross-source precision check for "${problem}" plus "${solution}".`,
      link: searchUrl("https://hn.algolia.com/?q=", `${problem} ${solution}`),
      metricContribution: "Evidence Quality",
      reason: "Higher when the query bundle has audience and exclusion controls.",
      signalStrength: sourceTermScore(specificity, audienceBonus + exclusionBonus),
    },
  ];

  const evidence = drafts.map<EvidenceItem>((draft, index) => ({
    id: `query-derived-${index + 1}`,
    date: generatedDate,
    included: true,
    duplicateCluster: `query-derived-${draft.metricContribution.toLowerCase().replaceAll(" ", "-")}`,
    ...draft,
  }));

  if (bundle.exclusions.length > 0) {
    evidence.push({
      id: "query-derived-exclusion-control",
      source: "Reddit",
      sourceType: "post",
      date: generatedDate,
      query: exclusion,
      snippet: `Wrong-meaning control query for excluded term "${exclusion}".`,
      link: searchUrl("https://www.reddit.com/search/?q=", exclusion),
      metricContribution: "Excluded",
      included: false,
      reason: "Excluded by the locked query bundle before scoring.",
      duplicateCluster: "query-derived-exclusion-control",
      signalStrength: 0,
    });
  }

  return evidence;
}

export function derivePillarScoresFromEvidence(evidence: EvidenceItem[]): PillarScores {
  return {
    demand: scoreByContribution(evidence, "Demand"),
    pain: scoreByContribution(evidence, "Pain"),
    momentum: scoreByContribution(evidence, "Momentum"),
    competitionFit: scoreByContribution(evidence, "Competition Fit"),
    activity: scoreByContribution(evidence, "Activity"),
    channelFit: scoreByContribution(evidence, "Channel Fit"),
    evidenceQuality: scoreByContribution(evidence, "Evidence Quality"),
  };
}

export function deriveUncertainty(bundle: QueryBundle) {
  let uncertainty = 24;

  if (bundle.problemKeywords.length > 0) {
    uncertainty -= 3;
  }

  if (bundle.solutionKeywords.length > 0) {
    uncertainty -= 3;
  }

  if (bundle.audienceKeywords.length > 0) {
    uncertainty -= 4;
  }

  if (bundle.competitorKeywords.length > 0) {
    uncertainty -= 2;
  }

  if (bundle.exclusions.length > 0) {
    uncertainty -= 3;
  }

  return Math.max(7, uncertainty);
}
