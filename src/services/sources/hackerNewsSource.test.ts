import { describe, expect, it } from "vitest";
import {
  buildHackerNewsItemUrl,
  normalizeHackerNewsItem,
} from "./hackerNewsSource";

describe("Hacker News source adapter", () => {
  it("builds official Firebase item URLs", () => {
    expect(buildHackerNewsItemUrl(123)).toBe(
      "https://hacker-news.firebaseio.com/v0/item/123.json",
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
});
