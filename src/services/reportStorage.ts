import type { CompassReportModel } from "./reportTypes";
import { findBestEvidenceSource, summarizeEvidenceGap } from "./reportInsights";

const storageKey = "impact-compass:report-snapshots";
const maxSnapshots = 10;

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type ReportSnapshot = {
  id: string;
  ideaName: string;
  lens: string;
  score: number;
  uncertainty: number;
  confidence: string;
  range: string;
  rankBasis: number;
  strongestPillar: string;
  weakestPillar: string;
  bestChannel: string;
  evidenceGap: string;
  generatedAt: string;
};

function slug(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function readSnapshots(storage: StorageLike): ReportSnapshot[] {
  const raw = storage.getItem(storageKey);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isReportSnapshot) : [];
  } catch {
    return [];
  }
}

function isReportSnapshot(value: unknown): value is ReportSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Partial<ReportSnapshot>;

  return (
    typeof snapshot.id === "string" &&
    typeof snapshot.ideaName === "string" &&
    typeof snapshot.score === "number" &&
    typeof snapshot.uncertainty === "number" &&
    typeof snapshot.confidence === "string" &&
    typeof snapshot.range === "string" &&
    typeof snapshot.rankBasis === "number" &&
    typeof snapshot.strongestPillar === "string" &&
    typeof snapshot.weakestPillar === "string" &&
    typeof snapshot.bestChannel === "string" &&
    typeof snapshot.evidenceGap === "string" &&
    typeof snapshot.generatedAt === "string"
  );
}

export function createReportSnapshot(
  report: CompassReportModel,
  generatedAt: string,
): ReportSnapshot {
  return {
    id: `${slug(report.idea.name)}-${slug(generatedAt)}`,
    ideaName: report.idea.name,
    lens: report.idea.lens,
    score: report.summary.score,
    uncertainty: report.summary.uncertainty,
    confidence: report.summary.confidence,
    range: `${report.summary.range.lower}-${report.summary.range.upper}`,
    rankBasis: report.summary.range.lower,
    strongestPillar: report.strongestPillar.label,
    weakestPillar: report.weakestPillar.label,
    bestChannel: findBestEvidenceSource(report),
    evidenceGap: summarizeEvidenceGap(report),
    generatedAt,
  };
}

export function listReportSnapshots(storage: StorageLike): ReportSnapshot[] {
  return readSnapshots(storage).sort((left, right) =>
    right.generatedAt.localeCompare(left.generatedAt),
  );
}

export function saveReportSnapshot(
  storage: StorageLike,
  report: CompassReportModel,
  generatedAt = new Date().toISOString(),
) {
  const snapshot = createReportSnapshot(report, generatedAt);
  const existing = readSnapshots(storage).filter((item) => item.id !== snapshot.id);
  const next = [snapshot, ...existing]
    .sort((left, right) => right.generatedAt.localeCompare(left.generatedAt))
    .slice(0, maxSnapshots);

  storage.setItem(storageKey, JSON.stringify(next));
  return snapshot;
}
