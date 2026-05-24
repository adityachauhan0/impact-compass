import type { ComparisonRow } from "../../services/comparison";

type ComparisonTableProps = {
  rows: ComparisonRow[];
};

export function ComparisonTable({ rows }: ComparisonTableProps) {
  return (
    <section className="rounded-lg border border-[#e5e0d8] bg-white shadow-sm">
      <div className="border-b border-[#e5e0d8] px-5 py-4">
        <h3 className="text-xl font-bold text-[#1f2933]">Comparison</h3>
        <p className="mt-1 text-sm text-[#536079]">
          Ranked by lower confidence bound, not raw score.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[900px] text-left text-sm">
          <thead className="bg-[#f7f4ef] text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Idea</th>
              <th className="px-5 py-3">Score</th>
              <th className="px-5 py-3">Range</th>
              <th className="px-5 py-3">Rank Basis</th>
              <th className="px-5 py-3">Confidence</th>
              <th className="px-5 py-3">Strongest</th>
              <th className="px-5 py-3">Weakest</th>
              <th className="px-5 py-3">Best Channel</th>
              <th className="px-5 py-3">Evidence Gap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e0d8]">
            {rows.map((row) => (
              <tr key={row.ideaName}>
                <td className="px-5 py-4 font-semibold text-[#1f2933]">{row.ideaName}</td>
                <td className="px-5 py-4 text-[#536079]">{row.score}</td>
                <td className="px-5 py-4 text-[#536079]">{row.range}</td>
                <td className="px-5 py-4 text-[#536079]">{row.rankBasis}</td>
                <td className="px-5 py-4 text-[#536079]">{row.confidence}</td>
                <td className="px-5 py-4 text-[#536079]">{row.strongestPillar}</td>
                <td className="px-5 py-4 text-[#536079]">{row.weakestPillar}</td>
                <td className="px-5 py-4 text-[#536079]">{row.bestChannel}</td>
                <td className="px-5 py-4 text-[#536079]">{row.evidenceGap}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
