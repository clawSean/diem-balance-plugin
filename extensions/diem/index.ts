// @ts-nocheck
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

function formatBalance(raw: string): string {
  const lines = raw.split("\n");

  let diem = "??";
  let reqUsed = "";
  let reqLimit = "";
  let tokUsed = "";
  let tokLimit = "";
  let httpStatus = "";

  for (const line of lines) {
    const l = line.toLowerCase();
    if (l.includes("http status:")) httpStatus = line.split(":").slice(1).join(":").trim();
    if (l.includes("x-venice-balance-diem:")) {
      const val = parseFloat(line.split(":").slice(1).join(":").trim());
      diem = isNaN(val) ? "??" : val.toFixed(4);
    }
    if (l.includes("x-ratelimit-remaining-requests:")) reqUsed = line.split(":").slice(1).join(":").trim();
    if (l.includes("x-ratelimit-limit-requests:")) reqLimit = line.split(":").slice(1).join(":").trim();
    if (l.includes("x-ratelimit-remaining-tokens:")) {
      const val = parseInt(line.split(":").slice(1).join(":").trim(), 10);
      tokUsed = isNaN(val) ? "?" : (val >= 1_000_000 ? (val / 1_000_000).toFixed(1) + "M" : val.toLocaleString());
    }
    if (l.includes("x-ratelimit-limit-tokens:")) {
      const val = parseInt(line.split(":").slice(1).join(":").trim(), 10);
      tokLimit = isNaN(val) ? "?" : (val >= 1_000_000 ? (val / 1_000_000).toFixed(1) + "M" : val.toLocaleString());
    }
  }

  if (diem === "??" && httpStatus === "402") diem = "0";

  // Compact output: bold label + monospaced value (degrades gracefully on plain-text channels)
  const lines: string[] = [];
  lines.push(`**🪙 Venice Diem Balance:** \`${diem} Diem\``);
  if (httpStatus === "402") {
    lines.push(`⚠️ Insufficient USD/Diem balance (HTTP 402)`);
    lines.push("Top-up: `https://venice.ai/settings/api`");
  }
  return lines.join("\n");
}

function resolveScriptPath(): string {
  // Priority:
  // 1) DIEM_SCRIPT_PATH env override
  // 2) bundled diem.py next to this file
  // 3) legacy workspace location
  const envPath = process.env.DIEM_SCRIPT_PATH;
  if (envPath) return envPath;

  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, "diem.py");
}

export default function register(api: any) {
  api.registerCommand({
    name: "diem",
    description: "Check Venice AI Diem balance (zero-token)",
    acceptsArgs: false,
    requireAuth: true,
    handler: async () => {
      try {
        const scriptPath = resolveScriptPath();
        const raw = execSync(`python3 ${JSON.stringify(scriptPath)}`, {
          encoding: "utf-8",
          timeout: 10000,
        });
        return { text: formatBalance(raw) };
      } catch (err: any) {
        return { text: "Error checking balance: " + err.message };
      }
    },
  });

  api.logger?.info?.("[diem] Plugin loaded - /diem command registered");
}
