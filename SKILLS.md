---
name: impact-compass
version: 1.0.0
description: |
  Evaluates startup ideas and product-market fit using live market research. Use this 
  when a user proposes a new product idea, feature, or tool. The skill formats the 
  user's idea into a JSON bundle, runs the Impact Compass CLI, and returns a 
  mathematically sound validation score based on real-world demand and competition saturation.
license: MIT
compatibility: claude-code opencode
allowed-tools:
  - Read
  - Write
  - Edit
  - RunCommand
---

# Impact Compass Idea Validator

You are equipped with the Impact Compass, a rigorous, purely statistical market research engine. When the user proposes a new app, startup, or feature idea, you must use this deterministic tool to validate it against real-world data before writing any code for them. Do not rely on your own training data to guess market demand—use the math.

## Your Task

When the user asks you to "validate this idea" or "is this a good startup idea":

1. **Ask clarifying questions (if needed):** Ensure you understand the specific target audience, the exact problem, and any known competitors.
2. **Draft the Query Bundle:** Create an `idea.json` file in the workspace representing the user's idea. Keep the keywords highly specific to avoid false positives.
3. **Run the CLI:** Execute `npx impact-compass idea.json output.json` after installing the package with `npm i impact-compass`, or use the local project script when working inside the source repo.
4. **Read the Output:** Read the resulting `output.json` file.
5. **Report to the User:** Do not just paste the JSON. Interpret the score for the user. Highlight their strongest pillar (e.g. Demand) and their weakest pillar (e.g. Competition Fit). If the score was heavily penalized due to market saturation (Red Ocean), warn them.

## Example JSON Structure

Write this to `idea.json` before running the CLI:

```json
{
  "idea": {
    "name": "Visual SQL Builder",
    "problem": "Writing complex joins is error-prone for junior analysts.",
    "targetUser": "Data Analysts",
    "lens": "Developer Tools"
  },
  "queryBundleForm": {
    "problemKeywords": "sql join error, too many sql tables",
    "solutionKeywords": "visual sql, no-code sql",
    "audienceKeywords": "data analyst, BI developer",
    "competitorKeywords": "metabase, looker",
    "exclusions": "nosql, mongodb"
  }
}
```

## Output JSON Schema

After the CLI runs, read `output.json`. Treat it as the evidence packet, not just a number.

```json
{
  "methodologyVersion": "0.1",
  "idea": {
    "name": "Visual SQL Builder",
    "problem": "Writing complex joins is error-prone for junior analysts.",
    "targetUser": "Data Analysts",
    "lens": "Developer Tools"
  },
  "queryBundle": {
    "version": 1,
    "locked": true,
    "problemKeywords": ["sql join error"],
    "solutionKeywords": ["visual sql"],
    "audienceKeywords": ["data analyst"],
    "competitorKeywords": ["metabase"],
    "painPhrases": ["manual process", "workaround"],
    "exclusions": ["nosql"]
  },
  "queryQuality": {
    "label": "Strong",
    "warning": "Ambiguity controlled with audience terms and exclusions."
  },
  "pillars": [
    {
      "key": "demand",
      "label": "Demand",
      "score": 82,
      "note": "Demand reads public-search targets..."
    }
  ],
  "formulas": [
    {
      "pillar": "Demand",
      "score": 82,
      "formula": "0.45 volume + 0.25 unique authors + ...",
      "formulaLatex": "0.45V + ...",
      "inputs": ["mention volume", "unique authors"]
    }
  ],
  "summary": {
    "score": 67,
    "uncertainty": 10,
    "confidence": "Medium",
    "range": {
      "lower": 57,
      "upper": 77
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
      "query": "visual sql",
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
    "score": 82,
    "note": "..."
  },
  "weakestPillar": {
    "key": "competitionFit",
    "label": "Competition Fit",
    "score": 28,
    "note": "..."
  },
  "interpretation": "Public evidence supports deeper validation...",
  "disclaimer": "This score reflects public evidence..."
}
```

When reporting back, prioritize `summary`, `strongestPillar`, `weakestPillar`, `integrity.warnings`, and the top `evidence` items. The user does not need a JSON dump. They need to know whether the market is alive, saturated, noisy, or fake.

## Why This Matters

As an AI agent, you are great at writing code, but you suffer from hallucinations when guessing what people actually want to buy. Impact Compass prevents you from building "ghost town" products. The tool itself contains zero AI. By relying on its deterministic, mathematical scoring of live public evidence from GitHub, Hacker News, Reddit, and Stack Exchange, you anchor your development roadmap in cold, hard reality.
