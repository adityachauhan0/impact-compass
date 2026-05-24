import type { EvidenceItem } from "../../domain/evidence";
import type { QueryBundle } from "../../domain/queryBundle";
import type { FetchJson, SourceAdapter } from "./sourceAdapter";

type NpmItem = {
  package: {
    name: string;
    description: string;
    links: { npm: string };
    date: string;
  };
  score: {
    detail: { popularity: number };
  };
};

type NpmSearchResponse = {
  objects?: NpmItem[];
};

export function buildNpmSearchUrl(term: string) {
  const query = encodeURIComponent(term);
  return `https://registry.npmjs.org/-/v1/search?text=${query}&size=5`;
}

function normalizePackage(item: NpmItem, query: string): EvidenceItem {
  return {
    id: `npm-pkg-${item.package.name}`,
    source: "npm",
    sourceType: "package",
    date: item.package.date.slice(0, 10),
    query,
    snippet: item.package.description || item.package.name,
    link: item.package.links.npm,
    metricContribution: "Momentum",
    included: true,
    reason: `Popularity score: ${Math.round(item.score.detail.popularity * 100)}%`,
    duplicateCluster: `npm-${item.package.name}`,
    signalStrength: Math.min(100, Math.round(item.score.detail.popularity * 100)),
  };
}

export function createNpmSourceAdapter({
  fetchJson,
}: {
  fetchJson: FetchJson;
}): SourceAdapter {
  return {
    id: "npm",
    label: "npm",
    bestFor: "Validating JS developer tools and library momentum.",
    limitations: "Only relevant for JavaScript ecosystem tools.",
    async scan(bundle: QueryBundle) {
      const query = bundle.solutionKeywords[0] ?? bundle.problemKeywords[0];

      if (!query) {
        return [];
      }

      const response = (await fetchJson(buildNpmSearchUrl(query))) as NpmSearchResponse;

      return (response.objects ?? []).map((item) => normalizePackage(item, query));
    },
  };
}
