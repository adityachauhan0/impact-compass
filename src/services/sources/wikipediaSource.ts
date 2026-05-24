import type { EvidenceItem } from "../../domain/evidence";
import type { QueryBundle } from "../../domain/queryBundle";
import type { FetchJson, SourceAdapter } from "./sourceAdapter";

type WikiItem = {
  pageid: number;
  title: string;
  snippet: string;
  timestamp: string;
};

type WikipediaResponse = {
  query?: {
    search?: WikiItem[];
  };
};

export function buildWikipediaSearchUrl(term: string) {
  const query = encodeURIComponent(term);
  return `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&utf8=&format=json&srlimit=5`;
}

function normalizeWiki(item: WikiItem, query: string): EvidenceItem {
  return {
    id: `wiki-page-${item.pageid}`,
    source: "Wikipedia",
    sourceType: "article",
    date: item.timestamp.slice(0, 10),
    query,
    snippet: item.title,
    link: `https://en.wikipedia.org/?curid=${item.pageid}`,
    metricContribution: "Evidence Quality",
    included: true,
    reason: `Established encyclopedia article exists for this concept.`,
    duplicateCluster: `wiki-${item.pageid}`,
    signalStrength: 80, // Wiki presence usually implies high baseline quality
  };
}

export function createWikipediaSourceAdapter({
  fetchJson,
}: {
  fetchJson: FetchJson;
}): SourceAdapter {
  return {
    id: "wikipedia",
    label: "Wikipedia",
    bestFor: "Establishing baseline conceptual validity and terminology.",
    limitations: "Does not prove market demand, only concept existence.",
    async scan(bundle: QueryBundle) {
      const query = bundle.solutionKeywords[0] ?? bundle.problemKeywords[0];

      if (!query) {
        return [];
      }

      const response = (await fetchJson(buildWikipediaSearchUrl(query))) as WikipediaResponse;

      return (response.query?.search ?? []).map((item) => normalizeWiki(item, query));
    },
  };
}
