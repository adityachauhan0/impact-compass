import type { EvidenceItem } from "../../domain/evidence";
import type { QueryBundle } from "../../domain/queryBundle";

export type FetchJson = (url: string) => Promise<unknown>;

export type SourceAdapter = {
  id: string;
  label: string;
  bestFor: string;
  limitations: string;
  scan(bundle: QueryBundle): Promise<EvidenceItem[]>;
};
