// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createDemoReport } from "../../services/demoReport";
import { loadPublicEvidenceReport } from "../../services/publicEvidenceReport";
import { ImpactCompassWorkspace } from "./ImpactCompassWorkspace";

afterEach(() => {
  cleanup();
});

function loadFastReport(input: Parameters<typeof loadPublicEvidenceReport>[0]) {
  return loadPublicEvidenceReport({
    ...input,
    fetchJson: async () => {
      throw new Error("skip live network in component tests");
    },
    minimumLoadMs: 0,
  });
}

describe("ImpactCompassWorkspace", () => {
  it("starts with editable idea and query fields", () => {
    render(<ImpactCompassWorkspace />);

    expect(screen.getByRole("heading", { name: "Impact Compass" })).toBeInTheDocument();
    expect(screen.getByText("Public evidence scoring")).toBeInTheDocument();
    expect(screen.getByLabelText("Compass background animation")).toBeInTheDocument();
    expect(screen.getByLabelText("Idea name")).toHaveValue(
      "Privacy-safe session note drafts",
    );
    expect(screen.getByLabelText("Problem statement")).toHaveValue(
      "Solo therapists lose unpaid time turning session context into structured notes.",
    );
    expect(screen.getByLabelText("Problem keywords")).toBeInTheDocument();
    expect(screen.getByText("Data sources ready")).toBeInTheDocument();
    expect(screen.queryByText("Evidence Ledger")).not.toBeInTheDocument();
  });

  it("shows the report only after the query bundle is locked", async () => {
    render(<ImpactCompassWorkspace loadReport={() => Promise.resolve(createDemoReport())} />);

    fireEvent.click(screen.getByRole("button", { name: /^begin compass analysis$/i }));

    expect(await screen.findByText("Impact Compass / Report")).toBeInTheDocument();
    expect(await screen.findByText("Evidence Ledger")).toBeInTheDocument();
    expect(screen.getByText("Locked v1")).toBeInTheDocument();
    expect(screen.getByText("Comparison")).toBeInTheDocument();
    expect(screen.getByText("Saved reports")).toBeInTheDocument();
  });

  it("generates the report from edited idea fields", async () => {
    render(<ImpactCompassWorkspace loadReport={loadFastReport} />);

    fireEvent.change(screen.getByLabelText("Idea name"), {
      target: { value: "Invoice follow-up autopilot" },
    });
    fireEvent.change(screen.getByLabelText("Problem keywords"), {
      target: { value: "late client payments, chasing invoices" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^begin compass analysis$/i }));

    expect(await screen.findByText("Invoice follow-up autopilot")).toBeInTheDocument();
    expect(screen.getAllByText(/late client payments/).length).toBeGreaterThan(0);
  });

  it("keeps the report hidden while public evidence is loading", async () => {
    let resolveReport: (report: ReturnType<typeof createDemoReport>) => void = () => {};
    const reportPromise = new Promise<ReturnType<typeof createDemoReport>>((resolve) => {
      resolveReport = resolve;
    });

    render(<ImpactCompassWorkspace loadReport={() => reportPromise} />);

    fireEvent.click(screen.getByRole("button", { name: /^begin compass analysis$/i }));

    expect(screen.getByText("Loading public evidence")).toBeInTheDocument();
    expect(screen.queryByText("Evidence Ledger")).not.toBeInTheDocument();

    resolveReport(createDemoReport());

    expect(await screen.findByText("Evidence Ledger")).toBeInTheDocument();
  });

  it("refreshes measured outputs from the edited query bundle", async () => {
    render(<ImpactCompassWorkspace loadReport={loadFastReport} />);

    fireEvent.change(screen.getByLabelText("Idea name"), {
      target: { value: "Invoice follow-up autopilot" },
    });
    fireEvent.change(screen.getByLabelText("Problem keywords"), {
      target: { value: "late client payments, unpaid invoices" },
    });
    fireEvent.change(screen.getByLabelText("Solution keywords"), {
      target: { value: "invoice reminder automation" },
    });
    fireEvent.change(screen.getByLabelText("Audience keywords"), {
      target: { value: "freelancers, consultants" },
    });
    fireEvent.change(screen.getByLabelText("Competitor keywords"), {
      target: { value: "HoneyBook alternative" },
    });
    fireEvent.change(screen.getByLabelText("Exclusions"), {
      target: { value: "medical billing" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^begin compass analysis$/i }));

    expect(await screen.findByText("Measured Query Bundle")).toBeInTheDocument();
    expect(screen.getAllByText(/invoice reminder automation/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/freelancers/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/medical billing/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/late client payments/).length).toBeGreaterThan(0);
    expect(
      screen.queryByText("Private-practice therapists discussing documentation spilling into evenings."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("SOAP notes")).not.toBeInTheDocument();
    expect(screen.queryByText(/paperwork burden/)).not.toBeInTheDocument();
    expect(screen.queryByText(/private-practice validation/)).not.toBeInTheDocument();
  });

  it("unlocks fields after a loading failure", async () => {
    render(
      <ImpactCompassWorkspace
        loadReport={() => Promise.reject(new Error("network unavailable"))}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^begin compass analysis$/i }));

    expect(await screen.findByText("network unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Evidence Ledger")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Idea name")).not.toBeDisabled());
  });

  it("returns from the generated report to the input workspace", async () => {
    render(<ImpactCompassWorkspace loadReport={loadFastReport} />);

    fireEvent.click(screen.getByRole("button", { name: /^begin compass analysis$/i }));

    expect(await screen.findByText("Impact Compass / Report")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^edit input$/i }));

    expect(screen.getByRole("heading", { name: "Impact Compass" })).toBeInTheDocument();
    expect(screen.getByLabelText("Idea name")).not.toBeDisabled();
  });
});
