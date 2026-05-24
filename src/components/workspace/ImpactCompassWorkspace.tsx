"use client";

import { Lock, Radar, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ComparisonTable } from "../comparison/ComparisonTable";
import { SavedReports } from "../history/SavedReports";
import { CompassReport } from "../report/CompassReport";
import { createLockedQueryBundle, evaluateQueryQuality } from "../../domain/queryBundle";
import { defaultIdea, defaultQueryForm } from "../../services/demoReport";
import { buildSnapshotComparisonRows } from "../../services/comparison";
import { buildCompassReport } from "../../services/reportBuilder";
import type { CompassReportModel } from "../../services/reportTypes";
import {
  listReportSnapshots,
  saveReportSnapshot,
  type ReportSnapshot,
} from "../../services/reportStorage";
import { therapyEvidenceSeed, therapyPillarScores } from "../../services/therapySeed";

const fieldClass =
  "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function ImpactCompassWorkspace() {
  const [lockedReport, setLockedReport] = useState<CompassReportModel | null>(null);
  const [savedReports, setSavedReports] = useState<ReportSnapshot[]>([]);
  const [ideaName, setIdeaName] = useState(defaultIdea.name);
  const [problem, setProblem] = useState(defaultIdea.problem);
  const [targetUser, setTargetUser] = useState(defaultIdea.targetUser);
  const [lens, setLens] = useState(defaultIdea.lens);
  const [problemKeywords, setProblemKeywords] = useState(defaultQueryForm.problemKeywords);
  const [solutionKeywords, setSolutionKeywords] = useState(
    defaultQueryForm.solutionKeywords,
  );
  const [audienceKeywords, setAudienceKeywords] = useState(
    defaultQueryForm.audienceKeywords,
  );
  const [competitorKeywords, setCompetitorKeywords] = useState(
    defaultQueryForm.competitorKeywords,
  );
  const [exclusions, setExclusions] = useState(defaultQueryForm.exclusions);
  const locked = lockedReport !== null;
  const queryForm = useMemo(
    () => ({
      problemKeywords,
      solutionKeywords,
      audienceKeywords,
      competitorKeywords,
      exclusions,
    }),
    [
      audienceKeywords,
      competitorKeywords,
      exclusions,
      problemKeywords,
      solutionKeywords,
    ],
  );
  const previewQueryBundle = useMemo(
    () => createLockedQueryBundle(queryForm),
    [queryForm],
  );
  const queryQuality = evaluateQueryQuality(previewQueryBundle);
  const comparisonRows = buildSnapshotComparisonRows(savedReports);

  useEffect(() => {
    const storage = getBrowserStorage();

    if (storage) {
      const frameId = window.requestAnimationFrame(() => {
        setSavedReports(listReportSnapshots(storage));
      });

      return () => window.cancelAnimationFrame(frameId);
    }
  }, []);

  function lockQueryBundle() {
    const report = buildCompassReport({
      idea: {
        name: ideaName,
        problem,
        targetUser,
        lens,
      },
      queryBundle: previewQueryBundle,
      evidence: therapyEvidenceSeed,
      pillarScores: therapyPillarScores,
      uncertainty: 11,
    });

    setLockedReport(report);

    const storage = getBrowserStorage();

    if (storage) {
      saveReportSnapshot(storage, report);
      setSavedReports(listReportSnapshots(storage));
    }
  }

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
                    {queryQuality.label}
                  </span>
                </div>
                <p className="mt-2 leading-5 text-emerald-900">
                  {queryQuality.warning}
                </p>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  onClick={lockQueryBundle}
                  disabled={locked}
                >
                  <Lock size={16} aria-hidden="true" />
                  Lock Query Bundle
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => setLockedReport(null)}
                  aria-label="Unlock query bundle"
                >
                  <RotateCcw size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
            <SavedReports snapshots={savedReports} />
          </aside>

          <div className="min-w-0">
            {lockedReport ? (
              <div className="space-y-5">
                <CompassReport report={lockedReport} />
                <ComparisonTable rows={comparisonRows} />
              </div>
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
