import { createLockedQueryBundle } from "../domain/queryBundle";
import { buildCompassReport } from "./reportBuilder";
import type { CompassReportModel, IdeaBrief } from "./reportTypes";
import { therapyEvidenceSeed, therapyPillarScores } from "./therapySeed";

export type DemoReport = CompassReportModel;

export const defaultIdea: IdeaBrief = {
  name: "Privacy-safe session note drafts",
  problem:
    "Solo therapists lose unpaid time turning session context into structured notes.",
  targetUser: "Solo therapists and small private clinics",
  lens: "B2B Workflow / Vertical SaaS",
};

export const defaultQueryForm = {
  problemKeywords: "therapist paperwork, therapy documentation, SOAP notes",
  solutionKeywords: "session note drafts, therapy note automation",
  audienceKeywords: "solo therapists, private practice therapists",
  competitorKeywords: "therapy notes app, EHR notes",
  exclusions: "physical therapy, school therapy notes",
};

export function createDemoReport(): DemoReport {
  return buildCompassReport({
    idea: defaultIdea,
    queryBundle: createLockedQueryBundle(defaultQueryForm),
    evidence: therapyEvidenceSeed,
    pillarScores: therapyPillarScores,
    uncertainty: 11,
  });
}
