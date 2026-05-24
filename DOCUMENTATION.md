# Impact Compass Documentation

Impact Compass is a purely statistical, deterministic CLI tool that runs your startup idea against public evidence from seven major platforms. It uses zero AI. It calculates demand, pain, momentum, and competition volume using strict mathematical formulas to generate a ruthless product-market fit score.

## Creating Your Idea File

The CLI requires a JSON file containing the core elements of your startup idea. You do not need to overthink this. Just write down what you know. 

Create a file named `idea.json` with the following structure:

```json
{
  "name": "Your Idea Name",
  "targetUser": "Who is going to use this?",
  "lens": "What category does this fall under? (e.g. Developer Tools, Productivity)",
  "problem": "What specific problem are you solving?",
  "audienceKeywords": ["keyword1", "keyword2"],
  "problemKeywords": ["complaint1", "pain point 2"],
  "solutionKeywords": ["solution name", "technology"],
  "competitorKeywords": ["existing app 1", "competitor 2"],
  "exclusions": ["unrelated meaning"]
}
```

### Keywords Matter
The scoring engine is merciless. If you use generic keywords like "app" or "software", the engine will pull in thousands of irrelevant results. Use the `exclusions` array to filter out noise. If your tool is for "React State Management," put "React Native" in the exclusions if you don't support mobile.

## Running the Evaluation

Execute the CLI by passing your input file and a destination for the report:

```bash
npm run cli idea.json output.json
```

The tool takes about 5-10 seconds to scrape the live APIs. It does not use cached data. It will then print an ASCII dashboard to your terminal and save the raw data to your output file.

## Interpreting the Score

- **90 - 100:** You found a unicorn. Massive demand, massive pain, almost zero competition. Start building immediately.
- **70 - 89:** Solid validation. There is a clear market, but you will face friction. 
- **50 - 69:** Red Ocean Warning. There is demand, but the market is heavily saturated with competitors. You need a highly specific niche to survive.
- **0 - 49:** Ghost Town. Nobody is talking about this problem online. Either your keywords are wrong, or you are building something nobody wants.

## Advanced Configuration

If you want to adjust how the engine punishes saturation, modify the `calculateCompassScore` function in `src/domain/scoring.ts`. If you want to add new data sources, append them to the adapter matrix in `src/services/sources/extendedAdapters.ts`.
