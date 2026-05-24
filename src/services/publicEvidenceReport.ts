import { createGitHubSourceAdapter } from "./sources/githubSource";
import { createHackerNewsSourceAdapter } from "./sources/hackerNewsSource";
import type { FetchJson, SourceAdapter } from "./sources/sourceAdapter";
import type { EvidenceItem } from "../domain/evidence";
import type { QueryBundle } from "../domain/queryBundle";
import {
  createQueryDerivedEvidence,
  derivePillarScoresFromEvidence,
  deriveUncertainty,
} from "./queryDerivedReport";
import { buildCompassReport } from "./reportBuilder";
import type { CompassReportModel, IdeaBrief } from "./reportTypes";

export type LoadPublicEvidenceReportInput = {
  idea: IdeaBrief;
  queryBundle: QueryBundle;
  fetchJson?: FetchJson;
  minimumLoadMs?: number;
};

const defaultMinimumLoadMs = 650;
const requestTimeoutMs = 8000;

async function defaultFetchJson(url: string) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Source request failed: ${response.status}`);
    }

    return response.json() as Promise<unknown>;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

async function scanSource(adapter: SourceAdapter, queryBundle: QueryBundle) {
  try {
    return await adapter.scan(queryBundle);
  } catch {
    return [];
  }
}

function mergeEvidence(primary: EvidenceItem[], fallback: EvidenceItem[]) {
  const seen = new Set<string>();

  return [...primary, ...fallback].filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

export async function loadPublicEvidenceReport({
  idea,
  queryBundle,
  fetchJson = defaultFetchJson,
  minimumLoadMs = defaultMinimumLoadMs,
}: LoadPublicEvidenceReportInput): Promise<CompassReportModel> {
  const startedAt = Date.now();
  const adapters = [
    createGitHubSourceAdapter({ fetchJson }),
    createHackerNewsSourceAdapter({ fetchJson }),
  ];
  const liveEvidence = (
    await Promise.all(adapters.map((adapter) => scanSource(adapter, queryBundle)))
  ).flat();
  const elapsed = Date.now() - startedAt;

  if (elapsed < minimumLoadMs) {
    await delay(minimumLoadMs - elapsed);
  }

  const fallbackEvidence = createQueryDerivedEvidence(idea, queryBundle);
  const evidence = mergeEvidence(liveEvidence, fallbackEvidence);

  return buildCompassReport({
    idea,
    queryBundle,
    evidence,
    pillarScores: derivePillarScoresFromEvidence(evidence),
    uncertainty: deriveUncertainty(queryBundle),
  });
}
