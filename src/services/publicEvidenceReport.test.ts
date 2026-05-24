import { describe, expect, it } from "vitest";
import { createLockedQueryBundle } from "../domain/queryBundle";
import { loadPublicEvidenceReport } from "./publicEvidenceReport";

const idea = {
  name: "Invoice follow-up autopilot",
  problem: "Freelancers lose time chasing late client payments.",
  targetUser: "Freelancers and consultants",
  lens: "Productivity / Prosumer SaaS",
};

describe("public evidence report loader", () => {
  it("waits for free source scans before building the report", async () => {
    const queryBundle = createLockedQueryBundle({
      problemKeywords: "invoice reminders",
      solutionKeywords: "invoice automation",
      audienceKeywords: "freelancers",
      competitorKeywords: "HoneyBook",
      exclusions: "medical billing",
    });
    const requestedUrls: string[] = [];
    const report = await loadPublicEvidenceReport({
      idea,
      queryBundle,
      minimumLoadMs: 0,
      fetchJson: async (url) => {
        requestedUrls.push(url);

        if (url.includes("api.github.com")) {
          return {
            items: [
              {
                id: 17,
                html_url: "https://github.com/example/invoices",
                full_name: "example/invoices",
                description: "Invoice reminder automation",
                updated_at: "2026-05-20T00:00:00Z",
                stargazers_count: 25,
                forks_count: 5,
              },
            ],
          };
        }

        return {
          hits: [
            {
              objectID: "42",
              title: "Ask HN: Invoice reminder workflows",
              created_at_i: 1770000000,
              points: 20,
              num_comments: 10,
            },
          ],
        };
      },
    });

    expect(requestedUrls.some((url) => url.includes("api.github.com"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("hn.algolia.com"))).toBe(true);
    expect(report.evidence.some((item) => item.id === "github-repo-17")).toBe(true);
    expect(report.evidence.some((item) => item.id === "hn-search-42")).toBe(true);
    expect(report.idea.name).toBe("Invoice follow-up autopilot");
  });
});
