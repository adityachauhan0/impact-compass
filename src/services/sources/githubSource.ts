import type { EvidenceItem } from "../../domain/evidence";
import type { QueryBundle } from "../../domain/queryBundle";
import type { FetchJson, SourceAdapter } from "./sourceAdapter";

type GitHubRepo = {
  id: number;
  html_url: string;
  full_name: string;
  description: string | null;
  updated_at: string;
  stargazers_count: number;
  forks_count: number;
};

type GitHubSearchResponse = {
  items?: GitHubRepo[];
};

export function buildGitHubSearchUrl(term: string) {
  const query = encodeURIComponent(term);
  return `https://api.github.com/search/repositories?q=${query}&sort=updated&order=desc&per_page=5`;
}

function normalizeRepo(repo: GitHubRepo, query: string): EvidenceItem {
  return {
    id: `github-repo-${repo.id}`,
    source: "GitHub",
    sourceType: "repo",
    date: repo.updated_at.slice(0, 10),
    query,
    snippet: repo.description || repo.full_name,
    link: repo.html_url,
    metricContribution: "Activity",
    included: true,
    reason: `${repo.stargazers_count} stars and ${repo.forks_count} forks; updated recently.`,
    duplicateCluster: `github-${repo.id}`,
    signalStrength: Math.min(100, Math.round(repo.stargazers_count + repo.forks_count)),
  };
}

export function createGitHubSourceAdapter({
  fetchJson,
}: {
  fetchJson: FetchJson;
}): SourceAdapter {
  return {
    id: "github",
    label: "GitHub",
    bestFor: "Devtools, open-source libraries, package ecosystems, and builder activity.",
    limitations: "Repository activity is not customer demand and can overrepresent dev-facing ideas.",
    async scan(bundle: QueryBundle) {
      const query = bundle.problemKeywords[0] ?? bundle.solutionKeywords[0];

      if (!query) {
        return [];
      }

      const response = (await fetchJson(buildGitHubSearchUrl(query))) as GitHubSearchResponse;

      return (response.items ?? []).map((repo) => normalizeRepo(repo, query));
    },
  };
}
