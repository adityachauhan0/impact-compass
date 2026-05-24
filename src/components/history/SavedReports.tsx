import type { ReportSnapshot } from "../../services/reportStorage";

type SavedReportsProps = {
  snapshots: ReportSnapshot[];
};

export function SavedReports({ snapshots }: SavedReportsProps) {
  return (
    <section className="rounded-lg border border-[#e5e0d8] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-[#1f2933]">Saved reports</h2>
      {snapshots.length === 0 ? (
        <p className="mt-3 text-sm leading-5 text-[#536079]">
          Begin a Compass analysis to save a local report snapshot.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="rounded-lg border border-[#e5e0d8] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#1f2933]">{snapshot.ideaName}</p>
                  <p className="mt-1 text-xs text-[#536079]">{snapshot.lens}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#1f2933]">{snapshot.score}</p>
                  <p className="text-xs text-[#536079]">{snapshot.confidence}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-[#536079]">
                Range {snapshot.range} · {new Date(snapshot.generatedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
