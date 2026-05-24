import type { EvidenceItem } from "../../domain/evidence";
import type { QueryBundle } from "../../domain/queryBundle";
import type { FetchJson, SourceAdapter } from "./sourceAdapter";

type StackItem = {
  question_id: number;
  title: string;
  link: string;
  score: number;
  answer_count: number;
  creation_date: number;
};

type StackExchangeResponse = {
  items?: StackItem[];
};

export function buildStackExchangeSearchUrl(term: string) {
  const query = encodeURIComponent(term);
  return `https://api.stackexchange.com/2.3/search?order=desc&sort=relevance&intitle=${query}&site=stackoverflow&pagesize=5`;
}

function normalizeQuestion(item: StackItem, query: string): EvidenceItem {
  return {
    id: `stackoverflow-q-${item.question_id}`,
    source: "Stack Exchange",
    sourceType: "question",
    date: new Date(item.creation_date * 1000).toISOString().slice(0, 10),
    query,
    snippet: item.title,
    link: item.link,
    metricContribution: "Channel Fit",
    included: true,
    reason: `${item.answer_count} answers and ${item.score} score on StackOverflow.`,
    duplicateCluster: `so-${item.question_id}`,
    signalStrength: Math.min(100, item.score * 5 + item.answer_count * 10),
  };
}

export function createStackExchangeSourceAdapter({
  fetchJson,
}: {
  fetchJson: FetchJson;
}): SourceAdapter {
  return {
    id: "stackexchange",
    label: "Stack Exchange",
    bestFor: "Technical problem validation and finding where devs hang out.",
    limitations: "Heavily skewed towards engineering problems.",
    async scan(bundle: QueryBundle) {
      const query = bundle.problemKeywords[0] ?? bundle.solutionKeywords[0];

      if (!query) {
        return [];
      }

      const response = (await fetchJson(buildStackExchangeSearchUrl(query))) as StackExchangeResponse;

      return (response.items ?? []).map((item) => normalizeQuestion(item, query));
    },
  };
}
