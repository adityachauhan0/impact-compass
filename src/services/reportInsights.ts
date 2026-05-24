import type { CompassReportModel } from "./reportTypes";

export function findBestEvidenceSource(report: CompassReportModel) {
  const counts = report.evidence
    .filter((item) => item.included)
    .reduce<Record<string, number>>((sourceCounts, item) => {
      sourceCounts[item.source] = (sourceCounts[item.source] ?? 0) + 1;
      return sourceCounts;
    }, {});

  return (
    Object.entries(counts).sort(([, left], [, right]) => right - left)[0]?.[0] ??
    "Unknown"
  );
}

export function summarizeEvidenceGap(report: CompassReportModel) {
  if (report.integrity.confidenceCap) {
    return `${report.integrity.confidenceCap} confidence cap`;
  }

  return `${report.weakestPillar.label} needs stronger evidence`;
}
