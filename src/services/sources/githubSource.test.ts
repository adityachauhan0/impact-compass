import { describe, expect, it } from "vitest";
import { createLockedQueryBundle } from "../../domain/queryBundle";
import { buildGitHubSearchUrl, createGitHubSourceAdapter } from "./githubSource";

describe("GitHub source adapter", () => {
  it("builds a public repository search URL from a query term", () => {
    expect(buildGitHubSearchUrl("therapy notes")).toBe(
      "https://api.github.com/search/repositories?q=therapy%20notes&sort=updated&order=desc&per_page=5",
    );
  });

  it("normalizes repository search results into evidence items", async () => {
    const adapter = createGitHubSourceAdapter({
      fetchJson: async () => ({
        items: [
          {
            id: 12,
            html_url: "https://github.com/example/notes",
            full_name: "example/notes",
            description: "Clinical notes automation experiments",
            updated_at: "2026-04-03T00:00:00Z",
            stargazers_count: 42,
            forks_count: 5,
          },
        ],
      }),
    });

    const evidence = await adapter.scan(
      createLockedQueryBundle({
        problemKeywords: "therapy notes",
        solutionKeywords: "",
        audienceKeywords: "therapists",
        competitorKeywords: "",
        exclusions: "physical therapy",
      }),
    );

    expect(evidence[0]).toMatchObject({
      id: "github-repo-12",
      source: "GitHub",
      sourceType: "repo",
      query: "therapy notes",
      metricContribution: "Activity",
      included: true,
    });
  });
});
