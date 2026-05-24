export type QueryBundleForm = {
  problemKeywords: string;
  solutionKeywords: string;
  audienceKeywords: string;
  competitorKeywords: string;
  exclusions: string;
};

export type QueryBundle = {
  version: number;
  locked: boolean;
  problemKeywords: string[];
  solutionKeywords: string[];
  audienceKeywords: string[];
  competitorKeywords: string[];
  painPhrases: string[];
  exclusions: string[];
};

export type QueryQualityLabel =
  | "Too broad"
  | "Too narrow"
  | "Ambiguous"
  | "Good enough"
  | "Strong";

export type QueryQuality = {
  label: QueryQualityLabel;
  warning: string;
};

const defaultPainPhrases = [
  "manual process",
  "too much paperwork",
  "after-hours notes",
  "how do I reduce",
  "alternative to",
  "too expensive",
  "workaround",
];

export function parseTermList(value: string) {
  const seen = new Set<string>();

  return value
    .split(/[,\n;]/)
    .map((term) => term.trim())
    .filter(Boolean)
    .filter((term) => {
      const key = term.toLocaleLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

export function createLockedQueryBundle(
  form: QueryBundleForm,
  options: { version?: number; painPhrases?: string[] } = {},
): QueryBundle {
  return {
    version: options.version ?? 1,
    locked: true,
    problemKeywords: parseTermList(form.problemKeywords),
    solutionKeywords: parseTermList(form.solutionKeywords),
    audienceKeywords: parseTermList(form.audienceKeywords),
    competitorKeywords: parseTermList(form.competitorKeywords),
    painPhrases: options.painPhrases ?? defaultPainPhrases,
    exclusions: parseTermList(form.exclusions),
  };
}

export function evaluateQueryQuality(bundle: QueryBundle): QueryQuality {
  const totalTerms =
    bundle.problemKeywords.length +
    bundle.solutionKeywords.length +
    bundle.audienceKeywords.length +
    bundle.competitorKeywords.length;

  if (bundle.problemKeywords.length <= 1 && bundle.audienceKeywords.length === 0) {
    return {
      label: "Too broad",
      warning: "Add audience terms and exclusions before scoring.",
    };
  }

  if (totalTerms <= 2) {
    return {
      label: "Too narrow",
      warning: "Add solution, audience, or competitor terms to improve coverage.",
    };
  }

  if (bundle.exclusions.length === 0) {
    return {
      label: "Ambiguous",
      warning: "Add exclusions for wrong meanings before scoring.",
    };
  }

  if (bundle.audienceKeywords.length > 0 && bundle.exclusions.length > 0) {
    return {
      label: "Strong",
      warning: "Ambiguity controlled with audience terms and exclusions.",
    };
  }

  return {
    label: "Good enough",
    warning: "Query bundle has enough terms for a preview-quality scan.",
  };
}
