import type { EvidenceItem } from "../domain/evidence";
import type { QueryBundle, QueryQuality } from "../domain/queryBundle";
import type { PillarScores, summarizeIntegrity } from "../domain/scoring";

export type IdeaBrief = {
  name: string;
  problem: string;
  targetUser: string;
  lens: string;
};

export type PillarSummary = {
  key: keyof PillarScores;
  label: string;
  score: number;
  note: string;
};

export type FormulaReadout = {
  pillar: string;
  score: number;
  formula: string;
  inputs: string[];
};

export type CompassReportModel = {
  methodologyVersion: string;
  idea: IdeaBrief;
  queryBundle: QueryBundle;
  queryQuality: QueryQuality;
  pillars: PillarSummary[];
  formulas: FormulaReadout[];
  summary: {
    score: number;
    uncertainty: number;
    confidence: string;
    range: {
      lower: number;
      upper: number;
    };
  };
  integrity: ReturnType<typeof summarizeIntegrity>;
  evidence: EvidenceItem[];
  strongestPillar: PillarSummary;
  weakestPillar: PillarSummary;
  interpretation: string;
  disclaimer: string;
};
