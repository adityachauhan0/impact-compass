# Impact Compass Documentation

Impact Compass is a purely statistical, deterministic CLI tool that runs your project idea against public evidence from seven major platforms. It uses zero AI. It calculates demand, pain, momentum, competition fit, activity, channel fit, and evidence quality using strict scoring logic to generate a ruthless project validation score.

## Creating Your Idea File

The CLI requires a JSON file containing your idea brief and the keyword bundle it should search. You do not need to overthink this, but do not feed it lazy keywords like `app` or `software` unless you enjoy drowning in garbage data.

Create a file named `idea.json` with the following structure:

```json
{
  "idea": {
    "name": "Your Idea Name",
    "problem": "What specific problem are you solving?",
    "targetUser": "Who is going to use this?",
    "lens": "What category does this fall under?"
  },
  "queryBundleForm": {
    "problemKeywords": "complaint one, pain point two",
    "solutionKeywords": "solution name, technology",
    "audienceKeywords": "target user, buyer persona",
    "competitorKeywords": "existing app one, competitor two",
    "exclusions": "unrelated meaning, wrong market"
  }
}
```

### Keywords Matter
The scoring engine is merciless. If you use generic keywords, the engine will pull in thousands of irrelevant results and confidently tell you the ocean is soup. Use `exclusions` to filter out wrong meanings. If your tool is for React state management, put `vue` and `angular` in exclusions if you do not care about those worlds.

## Running the Evaluation

Execute the CLI by passing your input file and a destination for the report:

```bash
npm i impact-compass
npx impact-compass idea.json output.json
```

The tool takes about 5-10 seconds to scrape the live APIs. It does not use cached data. It will then print an ASCII dashboard to your terminal and save the raw data to your output file.

## Output JSON Schema

The output file is a full report, not just a cute score slapped in a JSON trench coat.

```json
{
  "methodologyVersion": "0.1",
  "idea": {
    "name": "A fast global state manager for React",
    "problem": "Redux has too much boilerplate...",
    "targetUser": "React Developers",
    "lens": "Developer Tools"
  },
  "queryBundle": {
    "version": 1,
    "locked": true,
    "problemKeywords": ["react state management"],
    "solutionKeywords": ["atomic state"],
    "audienceKeywords": ["frontend developer"],
    "competitorKeywords": ["zustand"],
    "painPhrases": ["manual process", "workaround"],
    "exclusions": ["vue", "angular"]
  },
  "queryQuality": {
    "label": "Strong",
    "warning": "Ambiguity controlled with audience terms and exclusions."
  },
  "pillars": [
    {
      "key": "demand",
      "label": "Demand",
      "score": 100,
      "note": "Demand reads public-search targets..."
    }
  ],
  "formulas": [
    {
      "pillar": "Demand",
      "score": 100,
      "formula": "0.45 volume + 0.25 unique authors + ...",
      "formulaLatex": "0.45V + ...",
      "inputs": ["mention volume", "unique authors"]
    }
  ],
  "summary": {
    "score": 69,
    "uncertainty": 9,
    "confidence": "Medium",
    "range": {
      "lower": 60,
      "upper": 78
    }
  },
  "integrity": {
    "finalScoreAvailable": true,
    "confidenceCap": "Low",
    "warnings": []
  },
  "evidence": [
    {
      "id": "gh-123",
      "source": "GitHub",
      "sourceType": "repo",
      "date": "2026-05-24",
      "query": "atomic state",
      "snippet": "owner/repo-name",
      "link": "https://github.com/owner/repo-name",
      "metricContribution": "Activity",
      "included": true,
      "reason": "25 stars",
      "duplicateCluster": "gh-123",
      "signalStrength": 42
    }
  ],
  "strongestPillar": {
    "key": "demand",
    "label": "Demand",
    "score": 100,
    "note": "..."
  },
  "weakestPillar": {
    "key": "competitionFit",
    "label": "Competition Fit",
    "score": 22,
    "note": "..."
  },
  "interpretation": "Public evidence supports deeper validation...",
  "disclaimer": "This score reflects public evidence..."
}
```

### Output Fields

- `methodologyVersion`: Report logic version.
- `idea`: The idea brief you submitted.
- `queryBundle`: The locked, parsed keyword bundle the engine actually used.
- `queryQuality`: A label and warning about whether your keywords are too broad, too narrow, ambiguous, good enough, or strong.
- `pillars`: The seven score pillars: Demand, Pain, Momentum, Competition Fit, Activity, Channel Fit, and Evidence Quality.
- `formulas`: Human-readable formula notes for each pillar. `formulaLatex` is included for tools that can render it, but the README keeps things readable for normal humans.
- `summary`: Final score, uncertainty, confidence label, and score range.
- `integrity`: Whether a final score is available and any confidence warnings from weak evidence, low diversity, or noisy queries.
- `evidence`: The normalized source hits used by the report. This is where the bodies are buried.
- `strongestPillar` / `weakestPillar`: Fast diagnosis of what is carrying the idea and what is trying to sink it.
- `interpretation`: The blunt verdict text printed by the engine.
- `disclaimer`: Reminder that public signal is not destiny, it is just better than asking a chatbot to bless your startup.

## Interpreting the Score

- **90 - 100:** You found a unicorn. Massive demand, massive pain, almost zero competition. Start building immediately.
- **70 - 89:** Solid validation. There is a clear market, but you will face friction. 
- **50 - 69:** Red Ocean Warning. There is demand, but the market is heavily saturated with competitors. You need a highly specific niche to survive.
- **0 - 49:** Ghost Town. Nobody is talking about this problem online. Either your keywords are wrong, or you are building something nobody wants.

## Advanced Configuration

If you want to adjust how the engine punishes saturation, modify the `calculateCompassScore` function in `src/domain/scoring.ts`. If you want to add new data sources, append them to the adapter matrix in `src/services/sources/extendedAdapters.ts`.
