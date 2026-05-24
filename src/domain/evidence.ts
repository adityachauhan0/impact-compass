import type { QueryBundle } from "./queryBundle";

export type EvidenceSource =
  | "Hacker News"
  | "Reddit"
  | "GitHub"
  | "Product Hunt"
  | "Stack Exchange"
  | "YouTube"
  | "npm"
  | "PyPI";

export type SourceType =
  | "post"
  | "comment"
  | "repo"
  | "package"
  | "launch"
  | "question"
  | "video";

export type MetricContribution =
  | "Demand"
  | "Pain"
  | "Momentum"
  | "Competition Fit"
  | "Activity"
  | "Channel Fit"
  | "Evidence Quality"
  | "Excluded";

export type EvidenceItem = {
  id: string;
  source: EvidenceSource;
  sourceType: SourceType;
  date: string;
  query: string;
  snippet: string;
  link: string;
  metricContribution: MetricContribution;
  included: boolean;
  reason: string;
  duplicateCluster: string;
  signalStrength: number;
};

export type EvidenceIntegrityInput = {
  sourceDiversity: number;
  relevancePrecision: number;
  relevantEvidenceCount: number;
  dominantSourceShare: number;
};

function includesTerm(value: string, term: string) {
  return value.toLocaleLowerCase().includes(term.toLocaleLowerCase());
}

export function filterEvidenceForBundle(
  evidence: EvidenceItem[],
  bundle: QueryBundle,
): EvidenceItem[] {
  return evidence.map((item) => {
    const searchableText = `${item.query} ${item.snippet}`;
    const exclusion = bundle.exclusions.find((term) => includesTerm(searchableText, term));

    if (!exclusion) {
      return item;
    }

    return {
      ...item,
      included: false,
      metricContribution: "Excluded",
      reason: `Excluded by query bundle term: ${exclusion}.`,
    };
  });
}

export function calculateEvidenceIntegrity(
  evidence: EvidenceItem[],
): EvidenceIntegrityInput {
  const included = evidence.filter((item) => item.included);
  const sourceCounts = included.reduce<Record<string, number>>((counts, item) => {
    counts[item.source] = (counts[item.source] ?? 0) + 1;
    return counts;
  }, {});
  const dominantSourceCount = Math.max(0, ...Object.values(sourceCounts));

  return {
    sourceDiversity: Object.keys(sourceCounts).length,
    relevancePrecision:
      evidence.length === 0 ? 0 : Math.round((included.length / evidence.length) * 100),
    relevantEvidenceCount: included.length,
    dominantSourceShare:
      included.length === 0
        ? 0
        : Number((dominantSourceCount / included.length).toFixed(2)),
  };
}
