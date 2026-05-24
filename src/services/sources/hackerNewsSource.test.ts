import { describe, expect, it } from "vitest";
import {
  buildHackerNewsSearchUrl,
  createHackerNewsSourceAdapter,
  buildHackerNewsItemUrl,
  normalizeHackerNewsItem,
} from "./hackerNewsSource";
import { createLockedQueryBundle } from "../../domain/queryBundle";

describe("Hacker News source adapter", () => {
  it("builds official Firebase item URLs", () => {
    expect(buildHackerNewsItemUrl(123)).toBe(
      "https://hacker-news.firebaseio.com/v0/item/123.json",
    );
  });

  it("builds public Algolia search URLs", () => {
    expect(buildHackerNewsSearchUrl("invoice reminders")).toBe(
      "https://hn.algolia.com/api/v1/search?query=invoice%20reminders&tags=story",
    );
  });

  it("normalizes a story into an evidence item", () => {
    expect(
      normalizeHackerNewsItem(
        {
          id: 123,
          title: "Ask HN: How do you reduce documentation toil?",
          url: "https://news.ycombinator.com/item?id=123",
          time: 1770000000,
          score: 51,
          descendants: 24,
        },
        "documentation toil",
      ),
    ).toMatchObject({
      id: "hn-item-123",
      source: "Hacker News",
      sourceType: "post",
      query: "documentation toil",
      metricContribution: "Demand",
      included: true,
    });
  });

  it("scans search results into demand evidence", async () => {
    const adapter = createHackerNewsSourceAdapter({
      fetchJson: async () => ({
        hits: [
          {
            objectID: "42",
            title: "Ask HN: How do you handle invoice reminders?",
            url: "https://news.ycombinator.com/item?id=42",
            created_at_i: 1770000000,
            points: 12,
            num_comments: 8,
          },
        ],
      }),
    });

    const evidence = await adapter.scan(
      createLockedQueryBundle({
        problemKeywords: "invoice reminders",
        solutionKeywords: "",
        audienceKeywords: "freelancers",
        competitorKeywords: "",
        exclusions: "billing jobs",
      }),
    );

    expect(evidence[0]).toMatchObject({
      id: "hn-search-42",
      source: "Hacker News",
      query: "invoice reminders",
      metricContribution: "Demand",
      included: true,
    });
  });
});
