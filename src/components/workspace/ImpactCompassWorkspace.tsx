"use client";

import { Lock, Radar, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { CompassReport } from "../report/CompassReport";
import { createDemoReport } from "../../services/demoReport";

const fieldClass =
  "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

function join(values: string[]) {
  return values.join(", ");
}

export function ImpactCompassWorkspace() {
  const report = useMemo(() => createDemoReport(), []);
  const [locked, setLocked] = useState(false);
  const [ideaName, setIdeaName] = useState(report.idea.name);
  const [problem, setProblem] = useState(report.idea.problem);
  const [targetUser, setTargetUser] = useState(report.idea.targetUser);
  const [lens, setLens] = useState(report.idea.lens);
  const [problemKeywords, setProblemKeywords] = useState(
    join(report.queryBundle.problemKeywords),
  );
  const [solutionKeywords, setSolutionKeywords] = useState(
    join(report.queryBundle.solutionKeywords),
  );
  const [audienceKeywords, setAudienceKeywords] = useState(
    join(report.queryBundle.audienceKeywords),
  );
  const [competitorKeywords, setCompetitorKeywords] = useState(
    join(report.queryBundle.competitorKeywords),
  );
  const [exclusions, setExclusions] = useState(join(report.queryBundle.exclusions));

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">
              Impact Compass
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-950">
              Public evidence report
            </h1>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            Methodology v0.1 - Query Bundle v1
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Radar size={18} className="text-teal-700" aria-hidden="true" />
                <h2 className="text-base font-semibold text-slate-950">Idea brief</h2>
              </div>
              <div className="mt-4 space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Idea name
                  <input
                    className={fieldClass}
                    value={ideaName}
                    onChange={(event) => setIdeaName(event.target.value)}
                    disabled={locked}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Problem statement
                  <textarea
                    className={fieldClass}
                    rows={4}
                    value={problem}
                    onChange={(event) => setProblem(event.target.value)}
                    disabled={locked}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Target user
                  <input
                    className={fieldClass}
                    value={targetUser}
                    onChange={(event) => setTargetUser(event.target.value)}
                    disabled={locked}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Category lens
                  <select
                    className={fieldClass}
                    value={lens}
                    onChange={(event) => setLens(event.target.value)}
                    disabled={locked}
                  >
                    <option>B2B Workflow / Vertical SaaS</option>
                    <option>Devtool / API / Infra</option>
                    <option>AI / Automation Tool</option>
                    <option>Productivity / Prosumer SaaS</option>
                    <option>Consumer App</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">Query Bundle</h2>
              <div className="mt-4 space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Problem keywords
                  <textarea
                    className={fieldClass}
                    rows={2}
                    value={problemKeywords}
                    onChange={(event) => setProblemKeywords(event.target.value)}
                    disabled={locked}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Solution keywords
                  <textarea
                    className={fieldClass}
                    rows={2}
                    value={solutionKeywords}
                    onChange={(event) => setSolutionKeywords(event.target.value)}
                    disabled={locked}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Audience keywords
                  <textarea
                    className={fieldClass}
                    rows={2}
                    value={audienceKeywords}
                    onChange={(event) => setAudienceKeywords(event.target.value)}
                    disabled={locked}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Competitor keywords
                  <textarea
                    className={fieldClass}
                    rows={2}
                    value={competitorKeywords}
                    onChange={(event) => setCompetitorKeywords(event.target.value)}
                    disabled={locked}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Exclusions
                  <textarea
                    className={fieldClass}
                    rows={2}
                    value={exclusions}
                    onChange={(event) => setExclusions(event.target.value)}
                    disabled={locked}
                  />
                </label>
              </div>

              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-emerald-950">Query quality</span>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-emerald-800">
                    Strong
                  </span>
                </div>
                <p className="mt-2 leading-5 text-emerald-900">
                  Ambiguity controlled with mental-health audience terms and physical-therapy exclusions.
                </p>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  onClick={() => setLocked(true)}
                  disabled={locked}
                >
                  <Lock size={16} aria-hidden="true" />
                  Lock Query Bundle
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => setLocked(false)}
                  aria-label="Unlock query bundle"
                >
                  <RotateCcw size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            {locked ? (
              <CompassReport report={report} />
            ) : (
              <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
                <div className="max-w-md">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Preview mode
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Lock the query bundle to generate a final report.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Final scoring requires a visible, reproducible query bundle.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
