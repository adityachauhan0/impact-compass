"use client";

import { ExternalLink, RotateCcw, SlidersHorizontal } from "lucide-react";
import katex from "katex";
import { useMemo, useState } from "react";
import type { EvidenceItem } from "../../domain/evidence";
import type { CompassReportModel, PillarSummary } from "../../services/reportTypes";

type CompassReportProps = {
  report: CompassReportModel;
  onEditInput?: () => void;
  onNewScan?: () => void;
};

type PillarTone = {
  bar: string;
  text: string;
  fill: string;
};

const cardClass = "rounded-lg border border-[#e5e0d8] bg-white p-4 shadow-sm";
const eyebrowClass = "text-xs font-bold uppercase text-slate-500";
const mutedTextClass = "text-sm leading-6 text-[#536079]";

const pillarTones: PillarTone[] = [
  { bar: "bg-blue-600", text: "text-blue-700", fill: "#2563eb" },
  { bar: "bg-teal-700", text: "text-teal-700", fill: "#0f766e" },
  { bar: "bg-violet-600", text: "text-violet-700", fill: "#7c3aed" },
  { bar: "bg-sky-600", text: "text-sky-700", fill: "#0284c7" },
  { bar: "bg-emerald-700", text: "text-emerald-700", fill: "#047857" },
  { bar: "bg-amber-600", text: "text-amber-700", fill: "#d97706" },
  { bar: "bg-orange-700", text: "text-orange-700", fill: "#c2410c" },
];

function getTone(index: number) {
  return pillarTones[index % pillarTones.length];
}

function getPillarTone(pillars: PillarSummary[], label: string) {
  const index = pillars.findIndex((pillar) => pillar.label === label);
  return getTone(index < 0 ? 0 : index);
}

function uniqueCount(values: string[]) {
  return new Set(values).size;
}

function scoreBand(score: number) {
  if (score >= 72) {
    return "Strong signal";
  }

  if (score >= 58) {
    return "Promising but capped";
  }

  if (score >= 42) {
    return "Thin evidence";
  }

  return "Weak public signal";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function metricTone(item: EvidenceItem, pillars: PillarSummary[]) {
  if (!item.included || item.metricContribution === "Excluded") {
    return "text-orange-700";
  }

  return getPillarTone(pillars, item.metricContribution).text;
}

function FormulaMath({
  label,
  latex,
}: {
  label: string;
  latex: string;
}) {
  const html = useMemo(
    () =>
      katex.renderToString(latex, {
        displayMode: true,
        output: "htmlAndMathml",
        strict: "ignore",
        throwOnError: false,
      }),
    [latex],
  );

  return (
    <div
      aria-label={`${label} formula rendered as math`}
      className="formula-math mt-3 overflow-x-auto rounded-md border border-[#e5e0d8] bg-white px-3 py-3 text-[#1f2933]"
      dangerouslySetInnerHTML={{ __html: html }}
      role="img"
    />
  );
}

function CompassRadar({
  pillars,
  activeKey,
  onSelect,
}: {
  pillars: PillarSummary[];
  activeKey: PillarSummary["key"];
  onSelect: (pillar: PillarSummary) => void;
}) {
  const center = 120;
  const radius = 82;
  const axisCount = pillars.length;
  const polygonPoints = pillars
    .map((pillar, index) => {
      const angle = (Math.PI * 2 * index) / axisCount - Math.PI / 2;
      const scaledRadius = radius * (pillar.score / 100);

      return [
        center + Math.cos(angle) * scaledRadius,
        center + Math.sin(angle) * scaledRadius,
      ].join(",");
    })
    .join(" ");
  const gridPoints = [0.25, 0.5, 0.75, 1].map((scale) =>
    Array.from({ length: axisCount })
      .map((_, index) => {
        const angle = (Math.PI * 2 * index) / axisCount - Math.PI / 2;

        return [
          center + Math.cos(angle) * radius * scale,
          center + Math.sin(angle) * radius * scale,
        ].join(",");
      })
      .join(" "),
  );

  return (
    <svg
      className="min-h-56 w-full"
      viewBox="0 0 240 240"
      role="img"
      aria-label="Seven-pillar Compass graph"
    >
      {gridPoints.map((grid, index) => (
        <polygon
          key={grid}
          points={grid}
          fill="none"
          stroke={index === gridPoints.length - 1 ? "#d7d0c6" : "#ece6dc"}
          strokeWidth="1"
        />
      ))}
      {pillars.map((pillar, index) => {
        const angle = (Math.PI * 2 * index) / axisCount - Math.PI / 2;
        const axisX = center + Math.cos(angle) * radius;
        const axisY = center + Math.sin(angle) * radius;
        const labelRadius = radius + 18;
        const labelX = center + Math.cos(angle) * labelRadius;
        const labelY = center + Math.sin(angle) * labelRadius;

        return (
          <g key={pillar.key}>
            <line
              x1={center}
              y1={center}
              x2={axisX}
              y2={axisY}
              stroke={pillar.key === activeKey ? "#1f2933" : "#ece6dc"}
              strokeWidth={pillar.key === activeKey ? "1.5" : "1"}
            />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-500 text-[8px] font-semibold"
            >
              {pillar.score}
            </text>
          </g>
        );
      })}
      <polygon
        className="radar-polygon"
        points={polygonPoints}
        fill="#0f766e"
        fillOpacity="0.22"
        stroke="#0f766e"
        strokeWidth="3"
      />
      {pillars.map((pillar, index) => {
        const angle = (Math.PI * 2 * index) / axisCount - Math.PI / 2;
        const scaledRadius = radius * (pillar.score / 100);

        return (
          <circle
            key={pillar.key}
            cx={center + Math.cos(angle) * scaledRadius}
            cy={center + Math.sin(angle) * scaledRadius}
            r={pillar.key === activeKey ? 5 : 4}
            fill={getTone(index).fill}
            className="cursor-pointer transition"
            onClick={() => onSelect(pillar)}
          />
        );
      })}
      <circle cx={center} cy={center} r="3.5" fill="#1f2933" />
    </svg>
  );
}

export function CompassReport({ report, onEditInput, onNewScan }: CompassReportProps) {
  const [activePillarKey, setActivePillarKey] = useState(report.strongestPillar.key);
  const activePillar =
    report.pillars.find((pillar) => pillar.key === activePillarKey) ??
    report.strongestPillar;
  const includedEvidence = report.evidence.filter((item) => item.included);
  const excludedEvidence = report.evidence.filter((item) => !item.included);
  const sourceMix = uniqueCount(includedEvidence.map((item) => item.source));
  const averageSignal =
    includedEvidence.length === 0
      ? 0
      : Math.round(
          includedEvidence.reduce((sum, item) => sum + item.signalStrength, 0) /
            includedEvidence.length,
        );
  const rankedEvidence = useMemo(
    () =>
      [...report.evidence].sort((left, right) => {
        if (left.metricContribution === activePillar.label) {
          return -1;
        }

        if (right.metricContribution === activePillar.label) {
          return 1;
        }

        if (left.included !== right.included) {
          return left.included ? -1 : 1;
        }

        return right.signalStrength - left.signalStrength;
      }),
    [activePillar.label, report.evidence],
  );

  return (
    <section className="space-y-4" aria-label="Compass report">
      <header className="border-b border-[#e5e0d8] pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-[#536079]">
              Impact Compass / Report
            </p>
            <h2 className="serif-display mt-2 text-4xl font-semibold leading-tight tracking-normal text-[#1f2933] md:text-5xl">
              {report.idea.name}
            </h2>
            <p className="mt-2 text-sm text-[#536079]">{report.idea.lens}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onEditInput ? (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-[#d7d0c6] bg-white px-3 py-2 text-sm text-[#1f2933] transition hover:bg-[#f5f2ed]"
                type="button"
                onClick={onEditInput}
              >
                <SlidersHorizontal size={14} aria-hidden="true" />
                Edit input
              </button>
            ) : null}
            {onNewScan ? (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-[#d7d0c6] bg-white px-3 py-2 text-sm text-[#1f2933] transition hover:bg-[#f5f2ed]"
                type="button"
                onClick={onNewScan}
              >
                <RotateCcw size={14} aria-hidden="true" />
                New scan
              </button>
            ) : null}
            <span className="rounded-full border border-[#d7d0c6] bg-white px-3 py-2 text-sm text-[#1f2933]">
              Saved locally
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_250px]">
        <div className={cardClass}>
          <p className={eyebrowClass}>Compass Score</p>
          <p className="serif-display mt-3 text-8xl font-medium leading-none text-[#1f2933]">
            {report.summary.score}
          </p>
          <p className="mt-3 text-sm text-[#536079]">
            Range {report.summary.range.lower}-{report.summary.range.upper}
          </p>
          <p className="mt-1 text-sm text-[#536079]">
            {report.summary.confidence} confidence
          </p>
          <p className="mt-1 text-sm font-semibold text-[#1f2933]">
            +/- {report.summary.uncertainty}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eee9e1]">
            <div
              className="score-fill h-full rounded-full bg-[#1f2933]"
              style={{ width: `${report.summary.score}%` }}
            />
          </div>
        </div>

        <div className={cardClass}>
          <div className="grid gap-5 md:grid-cols-[minmax(190px,0.9fr)_minmax(0,1fr)] md:items-center">
            <CompassRadar
              pillars={report.pillars}
              activeKey={activePillarKey}
              onSelect={(pillar) => setActivePillarKey(pillar.key)}
            />
            <div>
              <p className="text-xl font-bold text-[#1f2933]">Dynamic pillar graph</p>
              <p className={`mt-2 ${mutedTextClass}`}>
                Graph responds to this report. Select any pillar to highlight its
                score, formula, and evidence rows.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-lg font-bold text-[#1f2933]">Strongest</p>
                  <p className="mt-1 text-sm text-[#536079]">
                    {report.strongestPillar.label} {report.strongestPillar.score}
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1f2933]">Weakest</p>
                  <p className="mt-1 text-sm text-[#536079]">
                    {report.weakestPillar.label} {report.weakestPillar.score}
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-md border border-[#e5e0d8] bg-[#fbfaf7] p-3">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Active pillar
                </p>
                <p className="mt-1 font-semibold text-[#1f2933]">
                  {activePillar.label}: {activePillar.score}
                </p>
                <p className="mt-1 text-sm leading-5 text-[#536079]">
                  {activePillar.note}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <p className={eyebrowClass}>Signal readout</p>
          <h3 className="mt-4 text-xl font-bold text-[#1f2933]">
            {scoreBand(report.summary.score)}
          </h3>
          <p className={`mt-2 ${mutedTextClass}`}>{report.interpretation}</p>
          <div className="mt-4 rounded-md bg-[#1f2933] p-3 text-sm text-white">
            Confidence limited by source diversity and duplicate clusters.
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cardClass}>
          <p className="text-2xl font-bold text-[#1f2933]">{includedEvidence.length}</p>
          <p className="mt-1 text-sm text-[#536079]">Included evidence</p>
        </div>
        <div className={cardClass}>
          <p className="text-2xl font-bold text-[#1f2933]">{excludedEvidence.length}</p>
          <p className="mt-1 text-sm text-[#536079]">Excluded evidence</p>
        </div>
        <div className={cardClass}>
          <p className="text-2xl font-bold text-[#1f2933]">{sourceMix}</p>
          <p className="mt-1 text-sm text-[#536079]">Included sources</p>
        </div>
        <div className={cardClass}>
          <p className="text-2xl font-bold text-[#1f2933]">{averageSignal}</p>
          <p className="mt-1 text-sm text-[#536079]">Average signal strength</p>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className={cardClass}>
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-[#1f2933]">Seven pillars</h3>
            <span className="rounded-full border border-[#d7d0c6] px-2 py-1 text-xs text-[#536079]">
              Select to filter ledger
            </span>
          </div>
          <div
            aria-label="Seven pillars scroll area"
            className="mt-4 max-h-[30rem] space-y-3 overflow-y-auto pr-2"
          >
            {report.pillars.map((pillar, index) => {
              const tone = getTone(index);
              const active = pillar.key === activePillarKey;

              return (
                <button
                  key={pillar.key}
                  className={`w-full rounded-md border p-2 text-left transition ${
                    active
                      ? "border-[#1f2933] bg-[#fbfaf7]"
                      : "border-transparent hover:border-[#e5e0d8]"
                  }`}
                  type="button"
                  onClick={() => setActivePillarKey(pillar.key)}
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-[#1f2933]">{pillar.label}</span>
                    <span className="font-bold text-[#1f2933]">{pillar.score}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eee9e1]">
                    <div
                      className={`score-fill h-full rounded-full ${tone.bar}`}
                      style={{ width: `${pillar.score}%` }}
                    />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#536079]">
                    {pillar.note}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className={cardClass}>
          <div className="flex flex-col gap-2 border-b border-[#e5e0d8] pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#1f2933]">Evidence Ledger</h3>
              <p className="mt-1 text-sm text-[#536079]">
                Sorted by active pillar / linked to graph / audit ready.
              </p>
            </div>
            <span className="rounded-full border border-[#d7d0c6] px-3 py-1 text-sm text-[#536079]">
              Highlighting {activePillar.label}
            </span>
          </div>
          <div
            aria-label="Evidence ledger scroll area"
            className="mt-4 max-h-[30rem] overflow-auto rounded-lg border border-[#e5e0d8]"
          >
            <table className="min-w-[760px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#f7f4ef] text-xs uppercase text-slate-500">
                <tr>
                  <th className="w-32 px-4 py-3">Source</th>
                  <th className="w-28 px-4 py-3">Query</th>
                  <th className="px-4 py-3">Evidence</th>
                  <th className="w-36 px-4 py-3">Impact</th>
                  <th className="w-36 px-4 py-3">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e0d8]">
                {rankedEvidence.map((item) => {
                  const isActive = item.metricContribution === activePillar.label;

                  return (
                    <tr
                      key={`${item.id}-${item.duplicateCluster}`}
                      className={isActive ? "bg-[#fbfaf7]" : "bg-white"}
                    >
                      <td className="px-4 py-4 align-top font-semibold text-[#1f2933]">
                        <a
                          className="inline-flex items-center gap-1 hover:text-[#2f4a36]"
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.source}
                          <ExternalLink size={13} aria-hidden="true" />
                        </a>
                        <span className="mt-1 block text-xs font-normal text-[#536079]">
                          {formatDate(item.date)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top text-[#536079]">{item.query}</td>
                      <td className="px-4 py-4 align-top leading-6 text-[#30405a]">
                        {item.snippet}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className={`font-bold ${metricTone(item, report.pillars)}`}>
                          {item.metricContribution === "Excluded"
                            ? "cap"
                            : `+ ${item.metricContribution.toLocaleLowerCase()}`}
                        </span>
                        <span className="mt-1 block text-xs text-[#536079]">
                          strength {item.signalStrength}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span
                          className={
                            item.included
                              ? "rounded-full border border-[#d7d0c6] bg-white px-2 py-1 text-xs font-semibold text-[#2f4a36]"
                              : "rounded-full border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-800"
                          }
                        >
                          {item.included ? "Included" : "Excluded"}
                        </span>
                        <span className="mt-2 block text-xs leading-5 text-[#536079]">
                          {item.reason}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className={cardClass}>
          <h3 className="text-xl font-bold text-[#1f2933]">Measured Query Bundle</h3>
          <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className={eyebrowClass}>Problem</p>
              <p className="mt-1 text-[#536079]">
                {report.queryBundle.problemKeywords.join(", ")}
              </p>
            </div>
            <div>
              <p className={eyebrowClass}>Solution</p>
              <p className="mt-1 text-[#536079]">
                {report.queryBundle.solutionKeywords.join(", ")}
              </p>
            </div>
            <div>
              <p className={eyebrowClass}>Audience</p>
              <p className="mt-1 text-[#536079]">
                {report.queryBundle.audienceKeywords.join(", ")}
              </p>
            </div>
            <div>
              <p className={eyebrowClass}>Competitors</p>
              <p className="mt-1 text-[#536079]">
                {report.queryBundle.competitorKeywords.join(", ")}
              </p>
            </div>
            <div>
              <p className={eyebrowClass}>Exclusions</p>
              <p className="mt-1 text-[#536079]">
                {report.queryBundle.exclusions.join(", ")}
              </p>
            </div>
            <div>
              <p className={eyebrowClass}>Quality</p>
              <p className="mt-1 font-medium text-[#1f2933]">
                {report.queryQuality.label}
              </p>
              <p className="mt-1 text-[#536079]">{report.queryQuality.warning}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-[#536079] md:grid-cols-3">
            <div>
              <span className={eyebrowClass}>Range</span>
              <p className="mt-1">
                {report.summary.range.lower}-{report.summary.range.upper}
              </p>
            </div>
            <div>
              <span className={eyebrowClass}>Query Bundle</span>
              <p className="mt-1">Locked v{report.queryBundle.version}</p>
            </div>
            <div>
              <span className={eyebrowClass}>Methodology</span>
              <p className="mt-1">Methodology v{report.methodologyVersion}</p>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <h3 className="text-xl font-bold text-[#1f2933]">Evidence health</h3>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md border border-[#e5e0d8] bg-[#fbfaf7] p-3">
              <dt className="text-[#536079]">Final score</dt>
              <dd className="mt-1 font-semibold text-[#1f2933]">
                {report.integrity.finalScoreAvailable ? "Available" : "Preview only"}
              </dd>
            </div>
            <div className="rounded-md border border-[#e5e0d8] bg-[#fbfaf7] p-3">
              <dt className="text-[#536079]">Confidence cap</dt>
              <dd className="mt-1 font-semibold text-[#1f2933]">
                {report.integrity.confidenceCap ?? "None"}
              </dd>
            </div>
            <div className="rounded-md border border-[#e5e0d8] bg-[#fbfaf7] p-3">
              <dt className="text-[#536079]">Strongest signal</dt>
              <dd className="mt-1 font-semibold text-[#1f2933]">
                {report.strongestPillar.label} signal
              </dd>
            </div>
            <div className="rounded-md border border-[#e5e0d8] bg-[#fbfaf7] p-3">
              <dt className="text-[#536079]">Weakest signal</dt>
              <dd className="mt-1 font-semibold text-[#1f2933]">
                {report.weakestPillar.label} signal
              </dd>
            </div>
          </dl>
          <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            {report.disclaimer}
          </p>
        </section>
      </div>

      <section className={cardClass}>
        <div className="flex flex-col gap-2 border-b border-[#e5e0d8] pb-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-bold text-[#1f2933]">Formula Readout</h3>
          <span className="text-sm text-[#536079]">
            Active formula: {activePillar.label}
          </span>
        </div>
        <div className="grid gap-px bg-white md:grid-cols-2">
          {report.formulas.map((formula) => {
            const active = formula.pillar === activePillar.label;

            return (
              <div
                key={formula.pillar}
                className={active ? "bg-[#fbfaf7] p-5" : "bg-white p-5"}
              >
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-bold text-[#1f2933]">{formula.pillar}</h4>
                  <span className="text-lg font-bold text-[#1f2933]">
                    {formula.score}
                  </span>
                </div>
                <FormulaMath label={formula.pillar} latex={formula.formulaLatex} />
                <p className="mt-3 text-xs font-semibold uppercase text-[#536079]">
                  Audit formula
                </p>
                <p className="mt-1 text-sm leading-5 text-[#30405a]">
                  {formula.formula}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#536079]">
                  Inputs: {formula.inputs.join(", ")}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
