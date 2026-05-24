import type { EvidenceItem } from "../../domain/evidence";
import type { QueryBundle } from "../../domain/queryBundle";
import type { FetchJson, SourceAdapter } from "./sourceAdapter";

async function safeFetch(fetchJson: FetchJson, url: string, parser: (data: any) => EvidenceItem[]) {
  try {
    const data = await fetchJson(url);
    return parser(data);
  } catch (e) {
    return [];
  }
}

function calculateRelevance(snippet: string, bundle: QueryBundle): number {
  if (!snippet) return 0.5; // Neutral penalty for no text
  
  const text = snippet.toLowerCase();
  const keywords = [
    ...bundle.problemKeywords,
    ...bundle.solutionKeywords,
    ...bundle.audienceKeywords,
    ...bundle.competitorKeywords
  ].flatMap(k => k.toLowerCase().split(" "));

  if (keywords.length === 0) return 1.0;

  // If at least one distinct keyword from any domain matches the snippet, it's relevant
  const hasMatch = keywords.some(k => k.length > 2 && text.includes(k));
  return hasMatch ? 1.0 : 0.4; // 60% penalty for irrelevance
}

export function createAll35Adapters({ fetchJson }: { fetchJson: FetchJson }): SourceAdapter[] {
  const adapters: SourceAdapter[] = [];

  const add = (
    id: string, label: string, pillar: EvidenceItem["metricContribution"], sourceType: string,
    queryFn: (b: QueryBundle) => string | undefined,
    urlFn: (q: string) => string,
    parseFn: (i: any, q: string) => EvidenceItem
  ) => {
    adapters.push({
      id, label, bestFor: pillar, limitations: "Public API rate limits apply.",
      scan: async (bundle) => {
        const q = queryFn(bundle);
        if (!q) return [];
        return safeFetch(fetchJson, urlFn(q), (data) => {
          let items = [];
          if (data.items) items = data.items;
          else if (data.hits) items = data.hits;
          else if (data.data?.children) items = data.data.children;
          else if (data.objects) items = data.objects;
          else if (data.query?.search) items = data.query.search;
          else if (data.results) items = data.results;
          return items.slice(0, 5).map((i: any) => {
            const parsed = parseFn(i, q);
            parsed.signalStrength = parsed.signalStrength * calculateRelevance(parsed.snippet, bundle);
            return parsed;
          });
        });
      }
    });
  };

  const sol = (b: QueryBundle) => b.solutionKeywords[0];
  const prob = (b: QueryBundle) => b.problemKeywords[0];
  const aud = (b: QueryBundle) => b.audienceKeywords[0];
  const comp = (b: QueryBundle) => b.competitorKeywords[0];

  // 1. GITHUB (Activity, Pain, Competition Fit, Momentum, Channel Fit)
  add("gh-act", "GitHub", "Activity", "repo", sol, 
    q => `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=updated`,
    (i, q) => ({ id: `gh-${i.id}`, source: "GitHub", sourceType: "repo", date: i.updated_at.slice(0,10), query: q, snippet: i.full_name, link: i.html_url, metricContribution: "Activity", included: true, reason: `${i.stargazers_count} stars`, duplicateCluster: `gh-${i.id}`, signalStrength: Math.min(100, Math.log10((i.stargazers_count||0) + 1) * 20) }));
  
  add("gh-pain", "GitHub", "Pain", "issue", prob, 
    q => `https://api.github.com/search/issues?q=${encodeURIComponent(q)}+type:issue`,
    (i, q) => ({ id: `ghi-${i.id}`, source: "GitHub", sourceType: "issue", date: i.created_at.slice(0,10), query: q, snippet: i.title, link: i.html_url, metricContribution: "Pain", included: true, reason: `${i.comments} comments`, duplicateCluster: `ghi-${i.id}`, signalStrength: Math.min(100, Math.log10((i.comments||0) + 1) * 30) }));

  add("gh-comp", "GitHub", "Competition Fit", "repo", comp, 
    q => `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}`,
    (i, q) => ({ id: `ghc-${i.id}`, source: "GitHub", sourceType: "repo", date: i.updated_at.slice(0,10), query: q, snippet: i.full_name, link: i.html_url, metricContribution: "Competition Fit", included: true, reason: `${i.forks_count} forks`, duplicateCluster: `ghc-${i.id}`, signalStrength: Math.min(100, Math.log10((i.forks_count||0) + 1) * 25) }));

  add("gh-mom", "GitHub", "Momentum", "commit", sol, 
    q => `https://api.github.com/search/commits?q=${encodeURIComponent(q)}`,
    (i, q) => ({ id: `ghm-${i.sha}`, source: "GitHub", sourceType: "commit", date: i.commit.author.date.slice(0,10), query: q, snippet: i.commit.message.slice(0, 50), link: i.html_url, metricContribution: "Momentum", included: true, reason: `Recent commit`, duplicateCluster: `ghm-${i.sha}`, signalStrength: 50 }));

  add("gh-chan", "GitHub", "Channel Fit", "user", aud, 
    q => `https://api.github.com/search/users?q=${encodeURIComponent(q)}`,
    (i, q) => ({ id: `ghu-${i.id}`, source: "GitHub", sourceType: "user", date: new Date().toISOString().slice(0,10), query: q, snippet: i.login, link: i.html_url, metricContribution: "Channel Fit", included: true, reason: `Target audience found`, duplicateCluster: `ghu-${i.id}`, signalStrength: 50 }));

  // 2. HACKER NEWS (Demand, Pain, Channel Fit, Momentum, Competition Fit)
  add("hn-dem", "HackerNews", "Demand", "story", sol, 
    q => `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story`,
    (i, q) => ({ id: `hn-${i.objectID}`, source: "Hacker News", sourceType: "story", date: i.created_at.slice(0,10), query: q, snippet: i.title, link: `https://news.ycombinator.com/item?id=${i.objectID}`, metricContribution: "Demand", included: true, reason: `${i.points} points`, duplicateCluster: `hn-${i.objectID}`, signalStrength: Math.min(100, Math.log10((i.points||0) + 1) * 30) }));

  add("hn-pain", "HackerNews", "Pain", "comment", prob, 
    q => `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=comment`,
    (i, q) => ({ id: `hnc-${i.objectID}`, source: "Hacker News", sourceType: "comment", date: i.created_at.slice(0,10), query: q, snippet: (i.comment_text||"").slice(0, 50), link: `https://news.ycombinator.com/item?id=${i.objectID}`, metricContribution: "Pain", included: true, reason: `Discussion on problem`, duplicateCluster: `hnc-${i.objectID}`, signalStrength: 60 }));

  add("hn-chan", "HackerNews", "Channel Fit", "story", aud, 
    q => `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}`,
    (i, q) => ({ id: `hna-${i.objectID}`, source: "Hacker News", sourceType: "story", date: i.created_at.slice(0,10), query: q, snippet: i.title || "", link: `https://news.ycombinator.com/item?id=${i.objectID}`, metricContribution: "Channel Fit", included: true, reason: `Audience discussion`, duplicateCluster: `hna-${i.objectID}`, signalStrength: Math.min(100, Math.log10((i.points||0) + 1) * 20) }));

  add("hn-mom", "HackerNews", "Momentum", "story", sol, 
    q => `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(q)}&tags=story`,
    (i, q) => ({ id: `hnm-${i.objectID}`, source: "Hacker News", sourceType: "story", date: i.created_at.slice(0,10), query: q, snippet: i.title, link: `https://news.ycombinator.com/item?id=${i.objectID}`, metricContribution: "Momentum", included: true, reason: `Recent growth`, duplicateCluster: `hnm-${i.objectID}`, signalStrength: Math.min(100, Math.log10((i.points||0) + 1) * 30) }));

  add("hn-comp", "HackerNews", "Competition Fit", "story", comp, 
    q => `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}`,
    (i, q) => ({ id: `hnp-${i.objectID}`, source: "Hacker News", sourceType: "story", date: i.created_at.slice(0,10), query: q, snippet: i.title || "", link: `https://news.ycombinator.com/item?id=${i.objectID}`, metricContribution: "Competition Fit", included: true, reason: `Competitor mentioned`, duplicateCluster: `hnp-${i.objectID}`, signalStrength: Math.min(100, Math.log10((i.points||0) + 1) * 25) }));

  // 3. REDDIT (Pain, Demand, Channel Fit, Momentum, Competition Fit)
  add("rd-pain", "Reddit", "Pain", "post", prob, 
    q => `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&limit=5`,
    (i, q) => ({ id: `rd-${i.data.id}`, source: "Reddit", sourceType: "post", date: new Date(i.data.created_utc*1000).toISOString().slice(0,10), query: q, snippet: i.data.title, link: `https://reddit.com${i.data.permalink}`, metricContribution: "Pain", included: true, reason: `${i.data.score} score`, duplicateCluster: `rd-${i.data.id}`, signalStrength: Math.min(100, Math.log10((i.data.score||0) + 1) * 20) }));

  add("rd-dem", "Reddit", "Demand", "post", sol, 
    q => `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&limit=5`,
    (i, q) => ({ id: `rdd-${i.data.id}`, source: "Reddit", sourceType: "post", date: new Date(i.data.created_utc*1000).toISOString().slice(0,10), query: q, snippet: i.data.title, link: `https://reddit.com${i.data.permalink}`, metricContribution: "Demand", included: true, reason: `${i.data.num_comments} comments`, duplicateCluster: `rdd-${i.data.id}`, signalStrength: Math.min(100, Math.log10((i.data.num_comments||0) + 1) * 25) }));

  add("rd-chan", "Reddit", "Channel Fit", "community", aud, 
    q => `https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(q)}&limit=5`,
    (i, q) => ({ id: `rdc-${i.data.id}`, source: "Reddit", sourceType: "subreddit", date: new Date().toISOString().slice(0,10), query: q, snippet: i.data.display_name, link: `https://reddit.com${i.data.url}`, metricContribution: "Channel Fit", included: true, reason: `${i.data.subscribers} subscribers`, duplicateCluster: `rdc-${i.data.id}`, signalStrength: Math.min(100, Math.log10((i.data.subscribers||0) + 1) * 15) }));

  add("rd-mom", "Reddit", "Momentum", "post", sol, 
    q => `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=new&limit=5`,
    (i, q) => ({ id: `rdm-${i.data.id}`, source: "Reddit", sourceType: "post", date: new Date(i.data.created_utc*1000).toISOString().slice(0,10), query: q, snippet: i.data.title, link: `https://reddit.com${i.data.permalink}`, metricContribution: "Momentum", included: true, reason: `Recent post`, duplicateCluster: `rdm-${i.data.id}`, signalStrength: Math.min(100, Math.log10((i.data.score||0) + 1) * 20) }));

  add("rd-comp", "Reddit", "Competition Fit", "post", comp, 
    q => `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&limit=5`,
    (i, q) => ({ id: `rdp-${i.data.id}`, source: "Reddit", sourceType: "post", date: new Date(i.data.created_utc*1000).toISOString().slice(0,10), query: q, snippet: i.data.title, link: `https://reddit.com${i.data.permalink}`, metricContribution: "Competition Fit", included: true, reason: `Competitor discussion`, duplicateCluster: `rdp-${i.data.id}`, signalStrength: Math.min(100, Math.log10((i.data.num_comments||0) + 1) * 20) }));

  // 4. STACK EXCHANGE (Channel Fit, Activity, Pain, Demand, Evidence Quality)
  add("se-chan", "StackExchange", "Channel Fit", "question", aud, 
    q => `https://api.stackexchange.com/2.3/search?order=desc&sort=relevance&intitle=${encodeURIComponent(q)}&site=stackoverflow&pagesize=5`,
    (i, q) => ({ id: `se-${i.question_id}`, source: "StackExchange", sourceType: "question", date: new Date(i.creation_date*1000).toISOString().slice(0,10), query: q, snippet: i.title, link: i.link, metricContribution: "Channel Fit", included: true, reason: `${i.score} score`, duplicateCluster: `se-${i.question_id}`, signalStrength: Math.min(100, Math.log10((i.score||0) + 1) * 25) }));

  add("se-act", "StackExchange", "Activity", "question", sol, 
    q => `https://api.stackexchange.com/2.3/search?order=desc&sort=activity&intitle=${encodeURIComponent(q)}&site=stackoverflow&pagesize=5`,
    (i, q) => ({ id: `sea-${i.question_id}`, source: "StackExchange", sourceType: "question", date: new Date(i.creation_date*1000).toISOString().slice(0,10), query: q, snippet: i.title, link: i.link, metricContribution: "Activity", included: true, reason: `${i.answer_count} answers`, duplicateCluster: `sea-${i.question_id}`, signalStrength: Math.min(100, Math.log10((i.answer_count||0) + 1) * 30) }));

  add("se-pain", "StackExchange", "Pain", "question", prob, 
    q => `https://api.stackexchange.com/2.3/search?order=desc&sort=relevance&intitle=${encodeURIComponent(q)}&site=stackoverflow&pagesize=5`,
    (i, q) => ({ id: `sep-${i.question_id}`, source: "StackExchange", sourceType: "question", date: new Date(i.creation_date*1000).toISOString().slice(0,10), query: q, snippet: i.title, link: i.link, metricContribution: "Pain", included: true, reason: `${i.view_count} views`, duplicateCluster: `sep-${i.question_id}`, signalStrength: Math.min(100, Math.log10((i.view_count||0) + 1) * 15) }));

  add("se-dem", "StackExchange", "Demand", "question", sol, 
    q => `https://api.stackexchange.com/2.3/search?order=desc&sort=votes&intitle=${encodeURIComponent(q)}&site=stackoverflow&pagesize=5`,
    (i, q) => ({ id: `sed-${i.question_id}`, source: "StackExchange", sourceType: "question", date: new Date(i.creation_date*1000).toISOString().slice(0,10), query: q, snippet: i.title, link: i.link, metricContribution: "Demand", included: true, reason: `Highly voted`, duplicateCluster: `sed-${i.question_id}`, signalStrength: Math.min(100, Math.log10((i.score||0) + 1) * 20) }));

  add("se-ev", "StackExchange", "Evidence Quality", "wiki", sol, 
    q => `https://api.stackexchange.com/2.3/tags/${encodeURIComponent(q.split(" ")[0])}/wikis?site=stackoverflow`,
    (i, q) => ({ id: `see-${i.tag_name}`, source: "StackExchange", sourceType: "wiki", date: new Date().toISOString().slice(0,10), query: q, snippet: i.tag_name, link: `https://stackoverflow.com/tags/${i.tag_name}`, metricContribution: "Evidence Quality", included: true, reason: `Established tag`, duplicateCluster: `see-${i.tag_name}`, signalStrength: 80 }));

  // 5. NPM (Momentum, Competition Fit, Activity, Demand, Channel Fit)
  add("npm-mom", "NPM", "Momentum", "package", sol, 
    q => `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=5`,
    (i, q) => ({ id: `npm-${i.package.name}`, source: "npm", sourceType: "package", date: i.package.date.slice(0,10), query: q, snippet: i.package.name, link: i.package.links.npm, metricContribution: "Momentum", included: true, reason: `Score: ${Math.round(i.score.final*100)}`, duplicateCluster: `npm-${i.package.name}`, signalStrength: Math.min(100, i.score.final * 100) }));

  add("npm-comp", "NPM", "Competition Fit", "package", comp, 
    q => `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=5`,
    (i, q) => ({ id: `npmc-${i.package.name}`, source: "npm", sourceType: "package", date: i.package.date.slice(0,10), query: q, snippet: i.package.name, link: i.package.links.npm, metricContribution: "Competition Fit", included: true, reason: `Competitor found`, duplicateCluster: `npmc-${i.package.name}`, signalStrength: Math.min(100, i.score.final * 100) }));

  add("npm-act", "NPM", "Activity", "package", prob, 
    q => `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=5`,
    (i, q) => ({ id: `npma-${i.package.name}`, source: "npm", sourceType: "package", date: i.package.date.slice(0,10), query: q, snippet: i.package.name, link: i.package.links.npm, metricContribution: "Activity", included: true, reason: `Active package`, duplicateCluster: `npma-${i.package.name}`, signalStrength: Math.min(100, i.score.final * 80) }));

  add("npm-dem", "NPM", "Demand", "package", sol, 
    q => `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&quality=1.0&size=5`,
    (i, q) => ({ id: `npmd-${i.package.name}`, source: "npm", sourceType: "package", date: i.package.date.slice(0,10), query: q, snippet: i.package.name, link: i.package.links.npm, metricContribution: "Demand", included: true, reason: `High quality demand`, duplicateCluster: `npmd-${i.package.name}`, signalStrength: Math.min(100, i.score.final * 90) }));

  add("npm-chan", "NPM", "Channel Fit", "package", aud, 
    q => `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=5`,
    (i, q) => ({ id: `npmch-${i.package.name}`, source: "npm", sourceType: "package", date: i.package.date.slice(0,10), query: q, snippet: i.package.name, link: i.package.links.npm, metricContribution: "Channel Fit", included: true, reason: `Audience tools`, duplicateCluster: `npmch-${i.package.name}`, signalStrength: Math.min(100, i.score.final * 70) }));

  // 6. WIKIPEDIA (Evidence Quality, Momentum, Channel Fit, Competition Fit, Activity)
  add("wk-ev", "Wikipedia", "Evidence Quality", "article", sol, 
    q => `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=5`,
    (i, q) => ({ id: `wk-${i.pageid}`, source: "Wikipedia", sourceType: "article", date: i.timestamp.slice(0,10), query: q, snippet: i.title, link: `https://en.wikipedia.org/?curid=${i.pageid}`, metricContribution: "Evidence Quality", included: true, reason: `Encyclopedia entry`, duplicateCluster: `wk-${i.pageid}`, signalStrength: 75 }));

  add("wk-mom", "Wikipedia", "Momentum", "article", sol, 
    q => `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=5`,
    (i, q) => ({ id: `wkm-${i.pageid}`, source: "Wikipedia", sourceType: "article", date: i.timestamp.slice(0,10), query: q, snippet: i.title, link: `https://en.wikipedia.org/?curid=${i.pageid}`, metricContribution: "Momentum", included: true, reason: `Wiki tracking`, duplicateCluster: `wkm-${i.pageid}`, signalStrength: 60 }));

  add("wk-chan", "Wikipedia", "Channel Fit", "article", aud, 
    q => `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=5`,
    (i, q) => ({ id: `wkc-${i.pageid}`, source: "Wikipedia", sourceType: "article", date: i.timestamp.slice(0,10), query: q, snippet: i.title, link: `https://en.wikipedia.org/?curid=${i.pageid}`, metricContribution: "Channel Fit", included: true, reason: `Audience defined`, duplicateCluster: `wkc-${i.pageid}`, signalStrength: 65 }));

  add("wk-comp", "Wikipedia", "Competition Fit", "article", comp, 
    q => `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=5`,
    (i, q) => ({ id: `wkp-${i.pageid}`, source: "Wikipedia", sourceType: "article", date: i.timestamp.slice(0,10), query: q, snippet: i.title, link: `https://en.wikipedia.org/?curid=${i.pageid}`, metricContribution: "Competition Fit", included: true, reason: `Competitor wiki`, duplicateCluster: `wkp-${i.pageid}`, signalStrength: 70 }));

  add("wk-act", "Wikipedia", "Activity", "article", prob, 
    q => `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=5`,
    (i, q) => ({ id: `wka-${i.pageid}`, source: "Wikipedia", sourceType: "article", date: i.timestamp.slice(0,10), query: q, snippet: i.title, link: `https://en.wikipedia.org/?curid=${i.pageid}`, metricContribution: "Activity", included: true, reason: `Problem activity`, duplicateCluster: `wka-${i.pageid}`, signalStrength: 50 }));

  // 7. APP STORE (Competition Fit, Momentum, Pain, Demand, Evidence Quality)
  add("as-comp", "App Store", "Competition Fit", "app", comp, 
    q => `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=software&limit=5`,
    (i, q) => ({ id: `as-${i.trackId}`, source: "App Store", sourceType: "app", date: i.releaseDate.slice(0,10), query: q, snippet: i.trackName, link: i.trackViewUrl, metricContribution: "Competition Fit", included: true, reason: `Existing competitor`, duplicateCluster: `as-${i.trackId}`, signalStrength: Math.min(100, Math.log10((i.userRatingCount||0) + 1) * 20) }));

  add("as-mom", "App Store", "Momentum", "app", sol, 
    q => `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=software&limit=5`,
    (i, q) => ({ id: `asm-${i.trackId}`, source: "App Store", sourceType: "app", date: i.releaseDate.slice(0,10), query: q, snippet: i.trackName, link: i.trackViewUrl, metricContribution: "Momentum", included: true, reason: `Solution exists`, duplicateCluster: `asm-${i.trackId}`, signalStrength: Math.min(100, Math.log10((i.userRatingCount||0) + 1) * 15) }));

  add("as-pain", "App Store", "Pain", "podcast", prob, 
    q => `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=podcast&limit=5`,
    (i, q) => ({ id: `asp-${i.trackId}`, source: "App Store", sourceType: "podcast", date: i.releaseDate.slice(0,10), query: q, snippet: i.trackName, link: i.trackViewUrl, metricContribution: "Pain", included: true, reason: `Podcast discussion`, duplicateCluster: `asp-${i.trackId}`, signalStrength: Math.min(100, Math.log10((i.userRatingCount||0) + 1) * 25) }));

  add("as-dem", "App Store", "Demand", "app", aud, 
    q => `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=software&limit=5`,
    (i, q) => ({ id: `asd-${i.trackId}`, source: "App Store", sourceType: "app", date: i.releaseDate.slice(0,10), query: q, snippet: i.trackName, link: i.trackViewUrl, metricContribution: "Demand", included: true, reason: `Audience apps`, duplicateCluster: `asd-${i.trackId}`, signalStrength: Math.min(100, Math.log10((i.userRatingCount||0) + 1) * 20) }));

  add("as-ev", "App Store", "Evidence Quality", "book", sol, 
    q => `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=ebook&limit=5`,
    (i, q) => ({ id: `ase-${i.trackId}`, source: "App Store", sourceType: "book", date: i.releaseDate.slice(0,10), query: q, snippet: i.trackName, link: i.trackViewUrl, metricContribution: "Evidence Quality", included: true, reason: `Published book`, duplicateCluster: `ase-${i.trackId}`, signalStrength: Math.min(100, Math.log10((i.userRatingCount||0) + 1) * 30) }));

  return adapters;
}
