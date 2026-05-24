import type { ReportSnapshot } from "../../services/reportStorage";

type SavedReportsProps = {
  snapshots: ReportSnapshot[];
};

export function SavedReports({ snapshots }: SavedReportsProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Saved reports</h2>
      {snapshots.length === 0 ? (
        <p className="mt-3 text-sm leading-5 text-slate-600">
          Lock a query bundle to save a local report snapshot.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="rounded-lg border border-slate-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-950">{snapshot.ideaName}</p>
                  <p className="mt-1 text-xs text-slate-500">{snapshot.lens}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-950">{snapshot.score}</p>
                  <p className="text-xs text-slate-500">{snapshot.confidence}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Range {snapshot.range} · {new Date(snapshot.generatedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
