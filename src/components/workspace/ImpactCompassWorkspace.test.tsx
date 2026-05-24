// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ImpactCompassWorkspace } from "./ImpactCompassWorkspace";

afterEach(() => {
  cleanup();
});

describe("ImpactCompassWorkspace", () => {
  it("starts with editable idea and query fields", () => {
    render(<ImpactCompassWorkspace />);

    expect(screen.getByLabelText("Idea name")).toHaveValue(
      "Privacy-safe session note drafts",
    );
    expect(screen.getByLabelText("Problem statement")).toHaveValue(
      "Solo therapists lose unpaid time turning session context into structured notes.",
    );
    expect(screen.getByLabelText("Problem keywords")).toBeInTheDocument();
    expect(screen.queryByText("Evidence Ledger")).not.toBeInTheDocument();
  });

  it("shows the report only after the query bundle is locked", () => {
    render(<ImpactCompassWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: /^lock query bundle$/i }));

    expect(screen.getByText("Evidence Ledger")).toBeInTheDocument();
    expect(screen.getByText("Locked v1")).toBeInTheDocument();
    expect(screen.getByText("Comparison")).toBeInTheDocument();
    expect(screen.getByText("Saved reports")).toBeInTheDocument();
  });

  it("generates the report from edited idea fields", () => {
    render(<ImpactCompassWorkspace />);

    fireEvent.change(screen.getByLabelText("Idea name"), {
      target: { value: "Invoice follow-up autopilot" },
    });
    fireEvent.change(screen.getByLabelText("Problem keywords"), {
      target: { value: "late client payments, chasing invoices" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^lock query bundle$/i }));

    expect(screen.getByText("Invoice follow-up autopilot")).toBeInTheDocument();
    expect(screen.getAllByText(/late client payments/).length).toBeGreaterThan(0);
  });
});
