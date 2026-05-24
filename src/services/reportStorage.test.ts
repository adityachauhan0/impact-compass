import { describe, expect, it } from "vitest";
import { createDemoReport } from "./demoReport";
import {
  createReportSnapshot,
  listReportSnapshots,
  saveReportSnapshot,
  type StorageLike,
} from "./reportStorage";

function memoryStorage(): StorageLike {
  const data = new Map<string, string>();

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}

describe("report storage service", () => {
  it("creates compact report snapshots for local history", () => {
    const snapshot = createReportSnapshot(createDemoReport(), "2026-05-24T04:00:00.000Z");

    expect(snapshot).toMatchObject({
      id: "privacy-safe-session-note-drafts-2026-05-24t04-00-00-000z",
      ideaName: "Privacy-safe session note drafts",
      score: 66,
      uncertainty: 11,
      confidence: "Medium",
      strongestPillar: "Pain",
      weakestPillar: "Activity",
      bestChannel: "Reddit",
      generatedAt: "2026-05-24T04:00:00.000Z",
    });
  });

  it("saves and lists snapshots newest first", () => {
    const storage = memoryStorage();
    const report = createDemoReport();

    saveReportSnapshot(storage, report, "2026-05-24T04:00:00.000Z");
    saveReportSnapshot(storage, report, "2026-05-24T05:00:00.000Z");

    expect(listReportSnapshots(storage).map((item) => item.generatedAt)).toEqual([
      "2026-05-24T05:00:00.000Z",
      "2026-05-24T04:00:00.000Z",
    ]);
  });

  it("keeps the ten newest snapshots", () => {
    const storage = memoryStorage();
    const report = createDemoReport();

    for (let index = 0; index < 12; index += 1) {
      saveReportSnapshot(
        storage,
        report,
        `2026-05-24T${String(index).padStart(2, "0")}:00:00.000Z`,
      );
    }

    expect(listReportSnapshots(storage)).toHaveLength(10);
    expect(listReportSnapshots(storage)[0].generatedAt).toBe(
      "2026-05-24T11:00:00.000Z",
    );
  });

  it("drops legacy snapshots that do not have comparison fields", () => {
    const storage = memoryStorage();

    storage.setItem(
      "impact-compass:report-snapshots",
      JSON.stringify([{ id: "old", ideaName: "Old", score: 50 }]),
    );

    expect(listReportSnapshots(storage)).toEqual([]);
  });
});
