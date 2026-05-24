# Impact Compass

<p align="center">
  <img src="assets/top-banner-readme.png" alt="Impact Compass CLI hero banner" width="100%" />
</p>

*grab a compass before you sail soldier*

A purely statistical, deterministic project idea validator and market research CLI.

Impact Compass fetches keyword rankings and engagement signals from real sources like GitHub, npm, Reddit, Stack Exchange, Hacker News, Wikipedia, and the App Store. It checks the *hype* around your project before you waste six months, a billion tokens, and enough coffee to make your keyboard anxious.

No AI. No vibes. No GPT wrapper whispering "*yo this idea is goated*" right before it lies to your face and stabs you in the roadmap.

Impact Compass is a deterministic engine. It pulls live, real-world evidence through an API-based keyword scoring pipeline, then runs that data through a brutal scoring engine to tell you if you found a blue ocean or if you are walking into another brilliant project that nobody wants.

## The Problem

You have a project idea. You search for it online. You see a few people talking about it, so you assume there is demand and start building for your billionaire dream.

Half a year later, you launch. Nobody cares. Water wasted on those GPUs.

Why? Because you didn't measure the noise. High demand means nothing if the market is already drowning in competitors. You need a way to measure actual pain against market saturation without spending weeks doing manual market research.

## How It Works

Impact Compass takes your idea and compiles a query bundle (problems, solutions, target audiences, and competitors). It then pulls live data from seven pillars of public evidence and runs an advanced logarithmic scoring algorithm. 

```mermaid
flowchart TD
  A["Idea brief JSON"] --> B["Query bundle compiler"]
  B --> C["35 source adapters"]
  C --> D["Public APIs: GitHub, Reddit, npm, Hacker News, Stack Exchange, Wikipedia, App Store"]
  D --> E["Evidence normalizer"]
  E --> F["Relevance filter: weak keyword match loses 60% signal"]
  F --> G["Pillar scorers: demand, pain, momentum, activity, competition, channel fit, evidence quality"]
  G --> H["Weighted score engine"]
  H --> I["Red ocean saturation penalty"]
  I --> J["Final score, confidence, interpretation, JSON report"]
```

It measures:
- **Demand & Pain:** Are people actually complaining about this, or is the problem minor?
- **Momentum & Activity:** Are developers and founders actively building in this space right now?
- **Competition Fit:** If the tool finds 10,000 competitors, your score tanks. Red oceans get penalized heavily.

The score is intentionally simple to read:

1. Score each pillar from 0 to 100.
2. Multiply every pillar by its weight.
3. Add those weighted pillar scores together.
4. Divide by the total weight.
5. Clamp the result between 0 and 100.
6. If demand is above 70 but competition fit is below 30, subtract an extra red-ocean penalty.

Translation: big demand is good, but big demand plus a crushed competition score means you are sailing into a red ocean with a paper boat.

The engine spits out a final score out of 100, along with a brutally honest interpretation of whether you should build it, pivot, or drop the idea entirely.

<p align="center">
  <!-- Demo GIF coming after npm publish: CLI run, ASCII art, and React State Management score. -->
</p>

## Quickstart

Install dependencies, then run an evaluation:

```bash
npm install
npm run cli example-react.json output.json
```

### The Input Schema

Give Impact Compass an idea brief and a locked query bundle. The CLI does the digging.

```json
{
  "idea": {
    "name": "A fast global state manager for React",
    "problem": "Redux has too much boilerplate and React context re-renders everything.",
    "targetUser": "React Developers",
    "lens": "Developer Tools"
  },
  "queryBundleForm": {
    "problemKeywords": "react state management, context api re-renders, redux boilerplate",
    "solutionKeywords": "atomic state, react global state library",
    "audienceKeywords": "frontend developer, react dev",
    "competitorKeywords": "zustand, jotai, recoil",
    "exclusions": "vue, angular"
  }
}
```

## Scoring Logic

We stripped out the generic averages. The engine uses logarithmic scaling, so a GitHub repo with 5,000 stars is weighted accurately against one with 5 stars. It applies relevance penalties. If a search result does not contain your target keywords, it loses 60% of its value instantly.

Most importantly, we built in a global saturation penalty. If an idea shows massive demand but identical levels of competition, the engine actively drags the score down. It is mathematically impossible to brute-force a 95+ score without finding a true blue ocean.

## Contributing

Pull requests are welcome. If you want to add a new data adapter, like scraping Twitter or IndieHackers, check out the `extendedAdapters.ts` file. Keep the parsing strict and use real engagement metrics.

## License

MIT License. See [LICENSE](LICENSE) for details.
