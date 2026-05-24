import type { EvidenceItem } from "../../domain/evidence";
import type { QueryBundle } from "../../domain/queryBundle";
import type { FetchJson, SourceAdapter } from "./sourceAdapter";

type iTunesItem = {
  trackId: number;
  trackName: string;
  description: string;
  trackViewUrl: string;
  releaseDate: string;
  userRatingCount?: number;
};

type iTunesResponse = {
  results?: iTunesItem[];
};

export function buildItunesSearchUrl(term: string) {
  const query = encodeURIComponent(term);
  return `https://itunes.apple.com/search?term=${query}&entity=software&limit=5`;
}

function normalizeApp(item: iTunesItem, query: string): EvidenceItem {
  return {
    id: `itunes-app-${item.trackId}`,
    source: "App Store",
    sourceType: "app",
    date: item.releaseDate.slice(0, 10),
    query,
    snippet: item.trackName,
    link: item.trackViewUrl,
    metricContribution: "Competition Fit",
    included: true,
    reason: `${item.userRatingCount || 0} user ratings. Existing competition detected.`,
    duplicateCluster: `app-${item.trackId}`,
    signalStrength: Math.min(100, (item.userRatingCount || 0) / 10),
  };
}

export function createItunesSourceAdapter({
  fetchJson,
}: {
  fetchJson: FetchJson;
}): SourceAdapter {
  return {
    id: "itunes",
    label: "App Store",
    bestFor: "Finding existing competitors in the consumer app space.",
    limitations: "B2B and web SaaS products won't be represented here.",
    async scan(bundle: QueryBundle) {
      const query = bundle.competitorKeywords[0] ?? bundle.solutionKeywords[0] ?? bundle.problemKeywords[0];

      if (!query) {
        return [];
      }

      const response = (await fetchJson(buildItunesSearchUrl(query))) as iTunesResponse;

      return (response.results ?? []).map((item) => normalizeApp(item, query));
    },
  };
}
