"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  Database,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ComparisonTable } from "../comparison/ComparisonTable";
import { SavedReports } from "../history/SavedReports";
import { CompassReport } from "../report/CompassReport";
import { createLockedQueryBundle, evaluateQueryQuality } from "../../domain/queryBundle";
import { defaultIdea, defaultQueryForm } from "../../services/demoReport";
import { buildSnapshotComparisonRows } from "../../services/comparison";
import { loadPublicEvidenceReport } from "../../services/publicEvidenceReport";
import type { CompassReportModel } from "../../services/reportTypes";
import {
  listReportSnapshots,
  saveReportSnapshot,
  type ReportSnapshot,
} from "../../services/reportStorage";

const fieldClass =
  "mt-2 w-full border-0 border-b border-[#d7d0c6] bg-transparent px-0 py-2 text-base text-[#1f2933] outline-none transition placeholder:text-slate-400 focus:border-[#2f4a36] disabled:text-slate-400";

const compactFieldClass =
  "mt-2 w-full rounded-md border border-[#e5e0d8] bg-[#fbfaf7] px-3 py-2 text-sm text-[#1f2933] outline-none transition placeholder:text-slate-400 focus:border-[#2f4a36] focus:bg-white disabled:text-slate-400";

type LoadReportInput = {
  idea: {
    name: string;
    problem: string;
    targetUser: string;
    lens: string;
  };
  queryBundle: ReturnType<typeof createLockedQueryBundle>;
};

type ImpactCompassWorkspaceProps = {
  loadReport?: (input: LoadReportInput) => Promise<CompassReportModel>;
};

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

function CompassAtmosphere() {
  return (
    <div
      aria-label="Compass background animation"
      className="compass-atmosphere absolute inset-0 overflow-hidden"
      role="img"
    >
      <div
        aria-hidden="true"
        className="compass-ring absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#cfc6b8]"
      />
      <div
        aria-hidden="true"
        className="compass-ring-slow absolute left-1/2 top-1/2 h-[23rem] w-[23rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ded7cc]"
      />
      <div
        aria-hidden="true"
        className="compass-sweep absolute left-1/2 top-1/2 h-[23rem] w-[23rem] -translate-x-1/2 -translate-y-1/2"
      >
        <span className="absolute left-1/2 top-1/2 h-px w-44 origin-left bg-gradient-to-r from-[#2f4a36]/20 to-transparent" />
      </div>
      <div
        aria-hidden="true"
        className="geo-line absolute left-[12%] right-[12%] top-[38%] h-px bg-gradient-to-r from-transparent via-[#1f2933]/15 to-transparent"
      />
      <div
        aria-hidden="true"
        className="geo-line-delayed absolute left-[18%] right-[18%] top-[59%] h-px bg-gradient-to-r from-transparent via-[#9a6b2f]/15 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2f4a36]"
      />
    </div>
  );
}

export function ImpactCompassWorkspace({
  loadReport = loadPublicEvidenceReport,
}: ImpactCompassWorkspaceProps) {
  const [lockedReport, setLockedReport] = useState<CompassReportModel | null>(null);
  const [savedReports, setSavedReports] = useState<ReportSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
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
  const controlsDisabled = loading;
  const queryTermCount =
    previewQueryBundle.problemKeywords.length +
    previewQueryBundle.solutionKeywords.length +
    previewQueryBundle.audienceKeywords.length +
    previewQueryBundle.competitorKeywords.length;

  useEffect(() => {
    const storage = getBrowserStorage();

    if (storage) {
      const frameId = window.requestAnimationFrame(() => {
        setSavedReports(listReportSnapshots(storage));
      });

      return () => window.cancelAnimationFrame(frameId);
    }
  }, []);

  async function lockQueryBundle() {
    const idea = {
      name: ideaName,
      problem,
      targetUser,
      lens,
    };

    setLoading(true);
    setLoadError(null);
    setLockedReport(null);

    try {
      const report = await loadReport({
        idea,
        queryBundle: previewQueryBundle,
      });

      setLockedReport(report);

      const storage = getBrowserStorage();

      if (storage) {
        saveReportSnapshot(storage, report);
        setSavedReports(listReportSnapshots(storage));
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Public evidence scan failed.");
    } finally {
      setLoading(false);
    }
  }

  function returnToInput() {
    setLockedReport(null);
    setLoadError(null);
  }

  if (lockedReport) {
    return (
      <main className="min-h-screen bg-[#fbfaf7] text-[#1f2933]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <CompassReport
            report={lockedReport}
            onEditInput={returnToInput}
            onNewScan={returnToInput}
          />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <ComparisonTable rows={comparisonRows} />
            <SavedReports snapshots={savedReports} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfaf7] text-[#1f2933]">
      <section className="relative flex min-h-screen flex-col">
        <div className="relative flex min-h-[44vh] items-center justify-center px-4 pt-10 text-center sm:min-h-[48vh]">
          <CompassAtmosphere />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Public evidence scoring
            </p>
            <h1 className="serif-display mt-3 text-6xl font-medium leading-none tracking-normal text-[#2f4a36] sm:text-7xl lg:text-8xl">
              Impact Compass
            </h1>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
              <span>Demand</span>
              <span>/</span>
              <span>Pain</span>
              <span>/</span>
              <span>Momentum</span>
              <span>/</span>
              <span>Evidence Quality</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 items-start justify-center px-4 pb-8 sm:px-6">
          <form
            className="w-full max-w-5xl rounded-lg border border-[#e5e0d8] bg-white/95 px-5 py-5 shadow-[0_24px_80px_rgba(31,41,51,0.08)] backdrop-blur sm:px-7"
            onSubmit={(event) => {
              event.preventDefault();
              void lockQueryBundle();
            }}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-400">
                Idea name
                <input
                  className={fieldClass}
                  value={ideaName}
                  onChange={(event) => setIdeaName(event.target.value)}
                  disabled={controlsDisabled}
                  placeholder="e.g. AI-driven logistics"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-400">
                Category lens
                <select
                  className={fieldClass}
                  value={lens}
                  onChange={(event) => setLens(event.target.value)}
                  disabled={controlsDisabled}
                >
                  <option>B2B Workflow / Vertical SaaS</option>
                  <option>Devtool / API / Infra</option>
                  <option>AI / Automation Tool</option>
                  <option>Productivity / Prosumer SaaS</option>
                  <option>Consumer App</option>
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-400 md:col-span-2">
                Problem statement
                <textarea
                  className={`${fieldClass} serif-display min-h-28 resize-y text-2xl italic leading-relaxed`}
                  value={problem}
                  onChange={(event) => setProblem(event.target.value)}
                  disabled={controlsDisabled}
                  placeholder="Describe the core problem you are solving..."
                />
              </label>
              <label className="block text-xs font-semibold text-slate-400">
                Target user
                <input
                  className={compactFieldClass}
                  value={targetUser}
                  onChange={(event) => setTargetUser(event.target.value)}
                  disabled={controlsDisabled}
                />
              </label>
              <label className="block text-xs font-semibold text-slate-400">
                Problem keywords
                <textarea
                  className={compactFieldClass}
                  rows={2}
                  value={problemKeywords}
                  onChange={(event) => setProblemKeywords(event.target.value)}
                  disabled={controlsDisabled}
                />
              </label>
              <label className="block text-xs font-semibold text-slate-400">
                Solution keywords
                <textarea
                  className={compactFieldClass}
                  rows={2}
                  value={solutionKeywords}
                  onChange={(event) => setSolutionKeywords(event.target.value)}
                  disabled={controlsDisabled}
                />
              </label>
              <label className="block text-xs font-semibold text-slate-400">
                Audience keywords
                <textarea
                  className={compactFieldClass}
                  rows={2}
                  value={audienceKeywords}
                  onChange={(event) => setAudienceKeywords(event.target.value)}
                  disabled={controlsDisabled}
                />
              </label>
              <label className="block text-xs font-semibold text-slate-400">
                Competitor keywords
                <textarea
                  className={compactFieldClass}
                  rows={2}
                  value={competitorKeywords}
                  onChange={(event) => setCompetitorKeywords(event.target.value)}
                  disabled={controlsDisabled}
                />
              </label>
              <label className="block text-xs font-semibold text-slate-400">
                Exclusions
                <textarea
                  className={compactFieldClass}
                  rows={2}
                  value={exclusions}
                  onChange={(event) => setExclusions(event.target.value)}
                  disabled={controlsDisabled}
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-4 border-t border-[#e5e0d8] pt-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Database size={13} aria-hidden="true" />
                  {queryTermCount} query terms detected
                </span>
                <span>{previewQueryBundle.problemKeywords.length} problem terms</span>
                <span>{previewQueryBundle.solutionKeywords.length} solution terms</span>
                <span className="inline-flex items-center gap-1 text-[#2f4a36]">
                  <CheckCircle2 size={13} aria-hidden="true" />
                  Data sources ready
                </span>
                <span className="rounded-full border border-[#d7d0c6] px-2 py-1 font-medium text-[#2f4a36]">
                  {queryQuality.label}
                </span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {loadError ? (
                  <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900">
                    {loadError}
                  </p>
                ) : null}
                {loading ? (
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#2f4a36]">
                    <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
                    Loading public evidence
                  </p>
                ) : null}
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md border border-[#d7d0c6] px-3 py-3 text-sm text-slate-600 transition hover:bg-[#f5f2ed] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    setLoadError(null);
                  }}
                  disabled={loading}
                  aria-label="Reset scan status"
                >
                  <RotateCcw size={16} aria-hidden="true" />
                </button>
                <button
                  type="submit"
                  className="inline-flex min-w-64 items-center justify-center gap-2 rounded-md bg-[#2f4a36] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(47,74,54,0.18)] transition hover:bg-[#243b2a] disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={controlsDisabled}
                >
                  {loading ? "Scanning" : "Begin Compass Analysis"}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              Precision in public evidence.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
