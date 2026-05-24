import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createLockedQueryBundle, type QueryBundleForm } from "./domain/queryBundle";
import { loadPublicEvidenceReport } from "./services/publicEvidenceReport";
import type { IdeaBrief } from "./services/reportTypes";

// Simple ANSI color definitions
const ANSI_RESET = "\x1b[0m";
const ANSI_BOLD = "\x1b[1m";
const ANSI_GREEN = "\x1b[32m";
const ANSI_YELLOW = "\x1b[33m";
const ANSI_CYAN = "\x1b[36m";
const ANSI_GRAY = "\x1b[90m";

type CliInput = {
  idea: IdeaBrief;
  queryBundleForm: QueryBundleForm;
};

function drawBar(score: number, width: number = 30): string {
  const filledLength = Math.round((score / 100) * width);
  const emptyLength = width - filledLength;
  const filled = "█".repeat(filledLength);
  const empty = "░".repeat(emptyLength);
  
  let color = ANSI_GREEN;
  if (score < 50) color = ANSI_YELLOW;
  if (score < 25) color = ANSI_GRAY;

  return `${color}${filled}${ANSI_RESET}${ANSI_GRAY}${empty}${ANSI_RESET}`;
}

const banner = `
${ANSI_CYAN}${ANSI_BOLD}  ___                            _      ____                                    
 |_ _|_ __ ___  _ __   __ _  ___| |_   / ___|___  _ __ ___  _ __   __ _ ___ ___ 
  | || '_ \` _ \\| '_ \\ / _\` |/ __| __| | |   / _ \\| '_ \` _ \\| '_ \\ / _\` / __/ __|
  | || | | | | | |_) | (_| | (__| |_  | |__| (_) | | | | | | |_) | (_| \\__ \\__ \\
 |___|_| |_| |_| .__/ \\__,_|\\___|\\__|  \\____\\___/|_| |_| |_| .__/ \\__,_|___/___/
               |_|                                         |_|                  ${ANSI_RESET}
`;

function wrapText(text: string, width: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  
  for (const word of words) {
    if (currentLine.length + word.length + 1 > width) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(`Usage: npm run cli <input.json> <output.json>`);
    process.exit(1);
  }

  const inputPath = resolve(process.cwd(), args[0]);
  const outputPath = resolve(process.cwd(), args[1]);

  let inputData: CliInput;
  try {
    const fileContent = readFileSync(inputPath, "utf-8");
    inputData = JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading or parsing input file: ${(error as Error).message}`);
    process.exit(1);
  }

  // 1. Create Query Bundle
  const queryBundle = createLockedQueryBundle(inputData.queryBundleForm);

  // --- REAL EVIDENCE COLLECTION LOGS ---
  console.log(`${ANSI_BOLD}${ANSI_GRAY}▶ INITIATING LIVE EVIDENCE COLLECTION PIPELINE...${ANSI_RESET}`);
  
  const fetchJson = async (url: string) => {
    let apiName = "Live API";
    try {
      const hostname = new URL(url).hostname;
      if (hostname.includes('github')) apiName = 'GitHub';
      else if (hostname.includes('algolia') || url.includes('hn.')) apiName = 'HackerNews';
      else if (hostname.includes('reddit')) apiName = 'Reddit';
      else if (hostname.includes('stackexchange')) apiName = 'StackExchange';
      else if (hostname.includes('npmjs')) apiName = 'NPM';
      else if (hostname.includes('wikipedia')) apiName = 'Wikipedia';
      else if (hostname.includes('apple')) apiName = 'App Store';
      else apiName = hostname;
    } catch(e) {}
    
    console.log(`  ${ANSI_CYAN}FETCH${ANSI_RESET} [${apiName} API] => ${url}`);
    const res = await fetch(url, { headers: { "User-Agent": "Impact-Compass-CLI" } });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    }
    return res.json();
  };

  // 2. Load Public Evidence Report using the full, robust architecture
  const report = await loadPublicEvidenceReport({
    idea: inputData.idea,
    queryBundle,
    fetchJson,
    minimumLoadMs: 0 // Run fast in CLI
  });
  
  console.log(`${ANSI_BOLD}${ANSI_GREEN}✔ API COLLECTION COMPLETE. (STRICT LIVE DATA ONLY)${ANSI_RESET}\n`);
  
  const summary = new Map<string, { count: number, typeLabel: string, sourceType: string, query: string, source: string }>();
  
  for (const item of report.evidence) {
    if (!item.included) continue;
    const typeLabel = `${ANSI_CYAN}LIVE${ANSI_RESET}`;
    const key = `${typeLabel}-${item.source}-${item.query}`;
    
    if (!summary.has(key)) {
      summary.set(key, { count: 1, typeLabel, sourceType: item.sourceType, query: item.query, source: item.source });
    } else {
      summary.get(key)!.count++;
    }
  }

  for (const info of summary.values()) {
    console.log(`  [${info.typeLabel}] ${info.source.padEnd(14, " ")} => Found ${info.count} ${info.sourceType}s for query: "${info.query}"`);
  }
  
  console.log("");

  // Output Aesthetic ASCII report
  console.log(banner);

  const boxWidth = 74;
  const drawTop = (title: string) => ` ┌─ ${ANSI_BOLD}${title.padEnd(boxWidth - 5, " ")}${ANSI_RESET}┐`;
  const drawBot = () => ` └${"─".repeat(boxWidth - 2)}┘`;
  const drawLine = (text: string) => {
    // Correctly strip ANSI codes matching the exact escape sequence
    const rawLen = text.replace(/\x1b\[[0-9;]*m/g, "").length;
    return ` │ ${text}${" ".repeat(Math.max(0, boxWidth - 4 - rawLen))} │`;
  };

  // IDEA BRIEF BOX
  console.log(drawTop("IDEA BRIEF"));
  console.log(drawLine(`${ANSI_GRAY}Name        :${ANSI_RESET} ${report.idea.name}`));
  console.log(drawLine(`${ANSI_GRAY}Target User :${ANSI_RESET} ${report.idea.targetUser}`));
  console.log(drawLine(`${ANSI_GRAY}Lens        :${ANSI_RESET} ${report.idea.lens}`));
  const wrappedProblem = wrapText(report.idea.problem, boxWidth - 18);
  console.log(drawLine(`${ANSI_GRAY}Problem     :${ANSI_RESET} ${wrappedProblem[0]}`));
  for (let i = 1; i < wrappedProblem.length; i++) {
    console.log(drawLine(`              ${wrappedProblem[i]}`));
  }
  console.log(drawBot());
  console.log("");

  // OVERALL SCORE BOX
  let scoreColor = ANSI_GREEN;
  if (report.summary.score < 60) scoreColor = ANSI_YELLOW;
  if (report.summary.score < 40) scoreColor = ANSI_GRAY;
  
  console.log(drawTop("OVERALL COMPASS SCORE"));
  console.log(drawLine(""));
  const scoreStr = `[ ${scoreColor}${ANSI_BOLD}${report.summary.score} / 100${ANSI_RESET} ]`;
  console.log(drawLine(`                              ${scoreStr}`));
  console.log(drawLine(""));
  console.log(drawLine(`${ANSI_GRAY}Confidence  :${ANSI_RESET} ${report.summary.confidence} (±${report.summary.uncertainty})`));
  const wrappedQ = wrapText(report.queryQuality.warning, boxWidth - 18);
  console.log(drawLine(`${ANSI_GRAY}Query Qual. :${ANSI_RESET} ${ANSI_BOLD}${report.queryQuality.label}${ANSI_RESET} - ${wrappedQ[0]}`));
  for (let i = 1; i < wrappedQ.length; i++) {
    console.log(drawLine(`              ${wrappedQ[i]}`));
  }
  if (report.integrity.warnings.length > 0) {
    console.log(drawLine(""));
    console.log(drawLine(`${ANSI_YELLOW}Warnings    :${ANSI_RESET} ${report.integrity.warnings[0]}`));
  }
  console.log(drawBot());
  console.log("");

  // PILLARS BOX
  console.log(drawTop("PILLAR BREAKDOWN"));
  console.log(drawLine(""));
  for (const pillar of report.pillars) {
    const label = pillar.label.padEnd(17, " ");
    const bar = drawBar(pillar.score, 35);
    const scoreText = pillar.score.toString().padStart(3, " ");
    console.log(drawLine(`  ${ANSI_BOLD}${label}${ANSI_RESET} [${bar}] ${scoreText}`));
  }
  console.log(drawLine(""));
  console.log(drawBot());
  console.log("");

  // INTERPRETATION
  console.log(drawTop("INTERPRETATION"));
  const wrappedInt = wrapText(report.interpretation, boxWidth - 4);
  for (const line of wrappedInt) {
    console.log(drawLine(line));
  }
  console.log(drawBot());
  console.log("");
  
  // Write the output to a JSON file
  try {
    writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");
    console.log(` ${ANSI_GREEN}✔ Report securely saved to ${outputPath}${ANSI_RESET}\n`);
  } catch (error) {
    console.error(`\nError writing output file: ${(error as Error).message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
