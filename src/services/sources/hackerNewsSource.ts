import type { EvidenceItem } from "../../domain/evidence";

export type HackerNewsItem = {
  id: number;
  title?: string;
  text?: string;
  url?: string;
  time: number;
  score?: number;
  descendants?: number;
};

export function buildHackerNewsItemUrl(id: number) {
  return `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
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
