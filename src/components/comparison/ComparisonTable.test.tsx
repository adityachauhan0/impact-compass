// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createDemoReport } from "../../services/demoReport";
import { buildSnapshotComparisonRows } from "../../services/comparison";
import { createReportSnapshot } from "../../services/reportStorage";
import { ComparisonTable } from "./ComparisonTable";

describe("ComparisonTable", () => {
  it("renders confidence-aware comparison rows", () => {
    const rows = buildSnapshotComparisonRows([
      createReportSnapshot(createDemoReport(), "2026-05-24T04:00:00.000Z"),
    ]);

    render(<ComparisonTable rows={rows} />);

    expect(screen.getByText("Comparison")).toBeInTheDocument();
    expect(screen.getByText("Privacy-safe session note drafts")).toBeInTheDocument();
    expect(screen.getByText("Rank Basis")).toBeInTheDocument();
    expect(screen.queryByText(/winner/i)).not.toBeInTheDocument();
  });
});
