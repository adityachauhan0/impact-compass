import type { EvidenceItem } from "../../domain/evidence";
import type { QueryBundle } from "../../domain/queryBundle";
import type { FetchJson, SourceAdapter } from "./sourceAdapter";

type RedditPost = {
  data: {
    id: string;
    title: string;
    selftext: string;
    score: number;
    num_comments: number;
    permalink: string;
    created_utc: number;
  };
};

type RedditSearchResponse = {
  data?: {
    children?: RedditPost[];
  };
};

export function buildRedditSearchUrl(term: string) {
  const query = encodeURIComponent(term);
  return `https://www.reddit.com/search.json?q=${query}&limit=5`;
}

function normalizePost(post: RedditPost, query: string): EvidenceItem {
  const data = post.data;
  return {
    id: `reddit-post-${data.id}`,
    source: "Reddit",
    sourceType: "post",
    date: new Date(data.created_utc * 1000).toISOString().slice(0, 10),
    query,
    snippet: data.title,
    link: `https://reddit.com${data.permalink}`,
    metricContribution: "Pain",
    included: true,
    reason: `${data.num_comments} comments and ${data.score} score.`,
    duplicateCluster: `reddit-${data.id}`,
    signalStrength: Math.min(100, data.score + data.num_comments * 2),
  };
}

export function createRedditSourceAdapter({
  fetchJson,
}: {
  fetchJson: FetchJson;
}): SourceAdapter {
  return {
    id: "reddit",
    label: "Reddit",
    bestFor: "Finding visceral pain points, consumer discussions, and unfiltered feedback.",
    limitations: "Search can return memes or unrelated subreddits.",
    async scan(bundle: QueryBundle) {
      const query = bundle.problemKeywords[0] ?? bundle.solutionKeywords[0];

      if (!query) {
        return [];
      }

      const response = (await fetchJson(buildRedditSearchUrl(query))) as RedditSearchResponse;

      return (response.data?.children ?? []).map((post) => normalizePost(post, query));
    },
  };
}
