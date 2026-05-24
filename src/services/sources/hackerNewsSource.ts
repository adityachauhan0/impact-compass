import type { EvidenceItem } from "../../domain/evidence";
import type { QueryBundle } from "../../domain/queryBundle";
import type { FetchJson, SourceAdapter } from "./sourceAdapter";

export type HackerNewsItem = {
  id: number;
  title?: string;
  text?: string;
  url?: string;
  time: number;
  score?: number;
  descendants?: number;
};

type HackerNewsSearchHit = {
  objectID: string;
  title?: string;
  story_title?: string;
  comment_text?: string;
  url?: string;
  story_url?: string;
  created_at_i?: number;
  points?: number;
  num_comments?: number;
};

type HackerNewsSearchResponse = {
  hits?: HackerNewsSearchHit[];
};

export function buildHackerNewsItemUrl(id: number) {
  return `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
}

export function buildHackerNewsSearchUrl(query: string) {
  return `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story`;
}

export function normalizeHackerNewsItem(
  item: HackerNewsItem,
  query: string,
): EvidenceItem {
  const date = new Date(item.time * 1000).toISOString().slice(0, 10);

  return {
    id: `hn-item-${item.id}`,
    source: "Hacker News",
    sourceType: "post",
    date,
    query,
    snippet: item.title || item.text || "Hacker News item",
    link: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
    metricContribution: "Demand",
    included: true,
    reason: `${item.score ?? 0} points and ${item.descendants ?? 0} comments.`,
    duplicateCluster: `hn-${item.id}`,
    signalStrength: Math.min(100, Math.round((item.score ?? 0) + (item.descendants ?? 0))),
  };
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeHackerNewsSearchHit(
  hit: HackerNewsSearchHit,
  query: string,
): EvidenceItem {
  const timestamp = hit.created_at_i ?? Math.floor(Date.now() / 1000);
  const title = hit.title || hit.story_title || stripHtml(hit.comment_text ?? "");

  return {
    id: `hn-search-${hit.objectID}`,
    source: "Hacker News",
    sourceType: "post",
    date: new Date(timestamp * 1000).toISOString().slice(0, 10),
    query,
    snippet: title || "Hacker News search result",
    link:
      hit.url ||
      hit.story_url ||
      `https://news.ycombinator.com/item?id=${hit.objectID}`,
    metricContribution: "Demand",
    included: true,
    reason: `${hit.points ?? 0} points and ${hit.num_comments ?? 0} comments from live search.`,
    duplicateCluster: `hn-search-${hit.objectID}`,
    signalStrength: Math.min(100, Math.round((hit.points ?? 0) + (hit.num_comments ?? 0))),
  };
}

export function createHackerNewsSourceAdapter({
  fetchJson,
}: {
  fetchJson: FetchJson;
}): SourceAdapter {
  return {
    id: "hacker-news",
    label: "Hacker News",
    bestFor: "Technical demand, builder discussion, launch discussion, and pain language.",
    limitations: "Strongly overrepresents technical audiences and builder-facing products.",
    async scan(bundle: QueryBundle) {
      const query = bundle.problemKeywords[0] ?? bundle.solutionKeywords[0];

      if (!query) {
        return [];
      }

      const response = (await fetchJson(
        buildHackerNewsSearchUrl(query),
      )) as HackerNewsSearchResponse;

      return (response.hits ?? [])
        .slice(0, 5)
        .map((hit) => normalizeHackerNewsSearchHit(hit, query));
    },
  };
}
