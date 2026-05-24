import { rankIdeasByEvidence } from "../domain/scoring";
import { findBestEvidenceSource, summarizeEvidenceGap } from "./reportInsights";
import type { ReportSnapshot } from "./reportStorage";
import type { CompassReportModel } from "./reportTypes";

export type ComparisonRow = {
  ideaName: string;
  score: number;
  confidence: string;
  range: string;
  rankBasis: number;
  strongestPillar: string;
  weakestPillar: string;
  bestChannel: string;
  evidenceGap: string;
};

export function buildComparisonRows(
  reports: CompassReportModel[],
): ComparisonRow[] {
  const ranked = rankIdeasByEvidence(
    reports.map((report) => ({
      id: report.idea.name,
      name: report.idea.name,
      score: report.summary.score,
      uncertainty: report.summary.uncertainty,
    })),
  );
  const reportByName = new Map(reports.map((report) => [report.idea.name, report]));

  return ranked.map((rankedIdea) => {
    const report = reportByName.get(rankedIdea.name);

    if (!report) {
      throw new Error(`Missing report for ${rankedIdea.name}`);
    }

    return {
      ideaName: report.idea.name,
      score: report.summary.score,
      confidence: report.summary.confidence,
      range: `${report.summary.range.lower}-${report.summary.range.upper}`,
      rankBasis: rankedIdea.rankBasis,
      strongestPillar: report.strongestPillar.label,
      weakestPillar: report.weakestPillar.label,
      bestChannel: findBestEvidenceSource(report),
      evidenceGap: summarizeEvidenceGap(report),
    };
  });
}

export function buildSnapshotComparisonRows(
  snapshots: ReportSnapshot[],
): ComparisonRow[] {
  const ranked = rankIdeasByEvidence(
    snapshots.map((snapshot) => ({
      id: snapshot.id,
      name: snapshot.ideaName,
      score: snapshot.score,
      uncertainty: snapshot.uncertainty,
    })),
  );
  const snapshotById = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));

  return ranked.map((rankedIdea) => {
    const snapshot = snapshotById.get(rankedIdea.id);

    if (!snapshot) {
      throw new Error(`Missing snapshot for ${rankedIdea.id}`);
    }

    return {
      ideaName: snapshot.ideaName,
      score: snapshot.score,
      confidence: snapshot.confidence,
      range: snapshot.range,
      rankBasis: rankedIdea.rankBasis,
      strongestPillar: snapshot.strongestPillar,
      weakestPillar: snapshot.weakestPillar,
      bestChannel: snapshot.bestChannel,
      evidenceGap: snapshot.evidenceGap,
    };
  });
}
