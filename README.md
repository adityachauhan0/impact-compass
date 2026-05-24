# Impact Compass

<p align="center">
  <!-- PLACEHOLDER_HERO_IMAGE: Add a sleek, high-quality banner image of the CLI tool running here -->
</p>

A purely statistical, deterministic startup idea validator and market research CLI. It mathematically evaluates your product market fit before you waste six months writing code. No AI. No LLM hallucinations. Just math.

Most business idea validators are just ChatGPT wrappers that tell you what you want to hear. Impact Compass is a deterministic engine. It scrapes live, real-world engagement data across GitHub, Hacker News, Reddit, Stack Exchange, npm, Wikipedia, and the App Store. Then it runs that data through a brutal scoring engine to tell you if you've found a blue ocean or if you're walking into an oversaturated trap.

## The Problem

You have a startup idea. You search for it online. You see a few people talking about it, so you assume there's demand and start building.

Half a year later, you launch. Nobody cares. 

Why? Because you didn't measure the noise. High demand means nothing if the market is already drowning in competitors. You need a way to measure actual pain against market saturation without spending weeks doing manual market research.

## How It Works

Impact Compass takes your idea and compiles a query bundle (problems, solutions, target audiences, and competitors). It then pulls live data from seven pillars of public evidence and runs an advanced logarithmic scoring algorithm. 

It measures:
- **Demand & Pain:** Are people actually complaining about this, or is the problem minor?
- **Momentum & Activity:** Are developers and founders actively building in this space right now?
- **Competition Fit:** If the tool finds 10,000 competitors, your score tanks. Red oceans get penalized heavily. 

The engine spits out a final score out of 100, along with a brutally honest interpretation of whether you should build it, pivot, or drop the idea entirely.

<p align="center">
  <!-- PLACEHOLDER_TERMINAL_GIF: Add a GIF showing the CLI tool executing the React State Management example and printing the ASCII art and score -->
</p>

## Quickstart

1. Clone the repository.
```bash
git clone https://github.com/adityachauhan0/impact-compass.git
cd impact-compass
```

2. Install dependencies.
```bash
npm install
```

3. Run an evaluation.
Pass it a JSON file containing your idea brief. We've included a React state management example so you can see how a hyper-saturated market gets scored and penalized down to reality.
```bash
npm run cli example-react.json output.json
```

## The Math Behind the Score

We stripped out the generic averages. The engine uses logarithmic scaling, so a GitHub repo with 5,000 stars is weighted accurately against one with 5 stars. It applies relevance penalties—if a search result doesn't contain your target keywords, it loses 60% of its value instantly.

Most importantly, we built in a global saturation penalty. If an idea shows massive demand but identical levels of competition, the engine actively drags the score down. It is mathematically impossible to brute-force a 95+ score without finding a true blue ocean.

## Contributing

Pull requests are welcome. If you want to add a new data adapter (like scraping Twitter or IndieHackers), check out the `extendedAdapters.ts` file. Keep the parsing strict and use real engagement metrics. 

## License

MIT License. See [LICENSE](LICENSE) for details.
