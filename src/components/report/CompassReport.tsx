import { ExternalLink } from "lucide-react";
import type { CompassReportModel, PillarSummary } from "../../services/reportTypes";

type CompassReportProps = {
  report: CompassReportModel;
};

function CompassRadar({ pillars }: { pillars: PillarSummary[] }) {
  const center = 120;
  const radius = 86;
  const axisCount = pillars.length;
  const points = pillars
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
    <svg viewBox="0 0 240 240" role="img" aria-label="Seven-pillar Compass graph">
      {gridPoints.map((grid, index) => (
        <polygon
          key={grid}
          points={grid}
          fill="none"
          stroke={index === gridPoints.length - 1 ? "#94a3b8" : "#d8dee8"}
          strokeWidth="1"
        />
      ))}
      {pillars.map((_, index) => {
        const angle = (Math.PI * 2 * index) / axisCount - Math.PI / 2;

        return (
          <line
            key={index}
            x1={center}
            y1={center}
            x2={center + Math.cos(angle) * radius}
            y2={center + Math.sin(angle) * radius}
            stroke="#d8dee8"
            strokeWidth="1"
          />
        );
      })}
      <polygon points={points} fill="#0f766e" fillOpacity="0.22" stroke="#0f766e" strokeWidth="3" />
      <circle cx={center} cy={center} r="4" fill="#0f766e" />
    </svg>
  );
}

export function CompassReport({ report }: CompassReportProps) {
  return (
    <section className="space-y-5" aria-label="Compass report">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">{report.idea.lens}</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">{report.idea.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {report.interpretation}
              </p>
            </div>
            <div className="min-w-36 rounded-lg border border-teal-200 bg-teal-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                Compass Score
              </p>
              <p className="mt-1 text-5xl font-semibold text-teal-950">{report.summary.score}</p>
              <p className="mt-1 text-sm font-medium text-teal-900">
                +/- {report.summary.uncertainty}
              </p>
              <p className="mt-2 text-xs font-semibold text-teal-800">
                {report.summary.confidence} confidence
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
            <div>
              <span className="block text-xs uppercase text-slate-400">Range</span>
              {report.summary.range.lower}-{report.summary.range.upper}
            </div>
            <div>
              <span className="block text-xs uppercase text-slate-400">Query Bundle</span>
              Locked v{report.queryBundle.version}
            </div>
            <div>
              <span className="block text-xs uppercase text-slate-400">Methodology</span>
              Methodology v{report.methodologyVersion}
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <CompassRadar pillars={report.pillars} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-950">Measured Query Bundle</h3>
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Problem</p>
            <p className="mt-1 text-slate-700">{report.queryBundle.problemKeywords.join(", ")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Solution</p>
            <p className="mt-1 text-slate-700">{report.queryBundle.solutionKeywords.join(", ")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Audience</p>
            <p className="mt-1 text-slate-700">{report.queryBundle.audienceKeywords.join(", ")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Competitors</p>
            <p className="mt-1 text-slate-700">{report.queryBundle.competitorKeywords.join(", ")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Exclusions</p>
            <p className="mt-1 text-slate-700">{report.queryBundle.exclusions.join(", ")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Quality</p>
            <p className="mt-1 font-medium text-slate-950">{report.queryQuality.label}</p>
            <p className="mt-1 text-slate-600">{report.queryQuality.warning}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-950">Seven pillars</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {report.pillars.map((pillar) => (
              <div key={pillar.key} className="grid gap-3 px-5 py-4 md:grid-cols-[160px_1fr_56px]">
                <div className="font-medium text-slate-950">{pillar.label}</div>
                <div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-teal-700"
                      style={{ width: `${pillar.score}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-600">{pillar.note}</p>
                </div>
                <div className="text-right text-lg font-semibold text-slate-950">{pillar.score}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-950">Score integrity</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Final score</dt>
              <dd className="font-medium text-slate-950">
                {report.integrity.finalScoreAvailable ? "Available" : "Preview only"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Strongest signal</dt>
              <dd className="font-medium text-slate-950">{report.strongestPillar.label} signal</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Weakest signal</dt>
              <dd className="font-medium text-slate-950">{report.weakestPillar.label} signal</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Confidence cap</dt>
              <dd className="font-medium text-slate-950">
                {report.integrity.confidenceCap ?? "None"}
              </dd>
            </div>
          </dl>
          <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-950">
            {report.disclaimer}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-950">Formula Readout</h3>
        </div>
        <div className="grid gap-px bg-slate-100 md:grid-cols-2">
          {report.formulas.map((formula) => (
            <div key={formula.pillar} className="bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-semibold text-slate-950">{formula.pillar}</h4>
                <span className="text-lg font-semibold text-slate-950">{formula.score}</span>
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-700">{formula.formula}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Inputs: {formula.inputs.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-950">Evidence Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="w-32 px-4 py-3">Source</th>
                <th className="w-32 px-4 py-3">Query</th>
                <th className="w-64 px-4 py-3">Evidence</th>
                <th className="w-28 px-4 py-3">Contribution</th>
                <th className="w-44 px-4 py-3">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.evidence.map((item) => (
                <tr key={`${item.source}-${item.date}-${item.duplicateCluster}`}>
                  <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-950">
                    <a
                      className="inline-flex items-center gap-1 text-teal-800 hover:text-teal-950"
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.source}
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                    <span className="block text-xs font-normal text-slate-500">{item.date}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{item.query}</td>
                  <td className="px-4 py-4 text-slate-700">{item.snippet}</td>
                  <td className="px-4 py-4 text-slate-600">{item.metricContribution}</td>
                  <td className="px-4 py-4">
                    <span
                      className={
                        item.included
                          ? "rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800"
                          : "rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-800"
                      }
                    >
                      {item.included ? "Included" : "Excluded"}
                    </span>
                    <span className="mt-2 block max-w-40 text-xs leading-5 text-slate-500">
                      {item.reason}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
