// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createDemoReport } from "../../services/demoReport";
import { CompassReport } from "./CompassReport";

afterEach(() => {
  cleanup();
});

describe("CompassReport", () => {
  it("renders the auditable report summary", () => {
    render(<CompassReport report={createDemoReport()} />);

    expect(screen.getAllByText("66").length).toBeGreaterThan(0);
    expect(screen.getByText("+/- 11")).toBeInTheDocument();
    expect(screen.getByText("Medium confidence")).toBeInTheDocument();
    expect(screen.getByText("Methodology v0.1")).toBeInTheDocument();
  });

  it("renders all seven pillars and evidence ledger entries", () => {
    render(<CompassReport report={createDemoReport()} />);

    expect(screen.getAllByText("Demand").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pain").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Momentum").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Competition Fit").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Activity").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Channel Fit").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Evidence Quality").length).toBeGreaterThan(0);
    expect(screen.getByText("Physical therapy treatment notes workflow discussion.")).toBeInTheDocument();
  });

  it("uses trust-safe report language", () => {
    render(<CompassReport report={createDemoReport()} />);

    expect(
      screen.getByText(/This score reflects public evidence found through selected sources/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/good idea/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bad idea/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/guaranteed/i)).not.toBeInTheDocument();
  });
});
