#!/usr/bin/env node
/**
 * Offline baseline tests for the diem plugin.
 * No external API calls, no auth required.
 * Run: node test.mjs
 */

import { readFileSync, mkdtempSync, writeFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import { tmpdir } from "node:os";

const HERE = path.dirname(fileURLToPath(import.meta.url));
let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) { console.log(`  PASS  ${label}`); passed++; }
  else           { console.error(`  FAIL  ${label}`); failed++; }
}

// ── 1. Manifest sanity ─────────────────────────────────────────────
console.log("\n▸ Manifest");
const manifest = JSON.parse(readFileSync(path.join(HERE, "openclaw.plugin.json"), "utf-8"));
assert("id === 'diem'", manifest.id === "diem");
assert("version is semver", /^\d+\.\d+\.\d+$/.test(manifest.version));
assert("activation.onStartup is true", manifest.activation?.onStartup === true);
assert("configSchema.type is object", manifest.configSchema?.type === "object");

// ── 2. Entry point loads & exports default function ─────────────────
console.log("\n▸ Entry point");
const mod = await import("./index.ts");
assert("default export is a function", typeof mod.default === "function");

// ── 3. Plugin registration (mock API) ──────────────────────────────
console.log("\n▸ Registration via mock api");
const registered = {};
const mockApi = {
  registerCommand(def) { registered[def.name] = def; },
  logger: { info() {} },
};
mod.default(mockApi);
assert("registers 'diem' command", "diem" in registered);
assert("command has handler function", typeof registered.diem?.handler === "function");
assert("command has description", typeof registered.diem?.description === "string" && registered.diem.description.length > 0);
assert("acceptsArgs is false", registered.diem?.acceptsArgs === false);

// ── 4. formatBalance logic (extracted via handler error path) ───────
// We can't call the handler directly (it shells out), but we can test
// formatBalance indirectly by importing the module internals.
// Since formatBalance isn't exported, we replicate its logic here to
// verify the parsing contract.
console.log("\n▸ formatBalance contract (inline replica)");

function formatBalance(raw) {
  const lines = raw.split("\n");
  let diem = "??";
  let httpStatus = "";
  for (const line of lines) {
    const l = line.toLowerCase();
    if (l.includes("http status:")) httpStatus = line.split(":").slice(1).join(":").trim();
    if (l.includes("x-venice-balance-diem:")) {
      const val = parseFloat(line.split(":").slice(1).join(":").trim());
      diem = isNaN(val) ? "??" : val.toFixed(4);
    }
  }
  if (diem === "??" && httpStatus === "402") diem = "0";
  return `**🪙 Venice Diem Balance:** \`${diem} Diem\``;
}

assert(
  "parses normal balance header",
  formatBalance("HTTP status: 200\nx-venice-balance-diem: 42.1234") ===
    "**🪙 Venice Diem Balance:** `42.1234 Diem`"
);
assert(
  "handles 402 (zero balance)",
  formatBalance("HTTP status: 402") ===
    "**🪙 Venice Diem Balance:** `0 Diem`"
);
assert(
  "handles missing headers gracefully",
  formatBalance("HTTP status: 200\nsome-other-header: foo") ===
    "**🪙 Venice Diem Balance:** `?? Diem`"
);
assert(
  "handles non-numeric diem value",
  formatBalance("x-venice-balance-diem: not-a-number") ===
    "**🪙 Venice Diem Balance:** `?? Diem`"
);
assert(
  "handles fractional diem rounding",
  formatBalance("x-venice-balance-diem: 0.00005") ===
    "**🪙 Venice Diem Balance:** `0.0001 Diem`"
);

// ── 5. diem.py syntax check ─────────────────────────────────────────
console.log("\n▸ diem.py");
try {
  execFileSync("python3", ["-m", "py_compile", path.join(HERE, "diem.py")], { encoding: "utf-8" });
  assert("diem.py compiles without syntax errors", true);
} catch (e) {
  assert("diem.py compiles without syntax errors", false);
}

// Exercise the actual handler, including shell metacharacters in script paths.
const probeDir = mkdtempSync(path.join(tmpdir(), "diem-argv-"));
const marker = path.join(probeDir, "should-not-exist");
// A relative sentinel inside command substitution would execute with the old shell.
const script = path.join(probeDir, 'balance $(touch should-not-exist).py');
writeFileSync(script, 'print("x-venice-balance-diem: 12.5")\n');
const oldPath = process.env.DIEM_SCRIPT_PATH, oldCwd = process.cwd();
try {
  process.chdir(probeDir); process.env.DIEM_SCRIPT_PATH = script;
  const result = await registered.diem.handler();
  assert("actual handler keeps script path literal", result.text.includes("12.5000 Diem"));
  assert("script path never executes a shell substitution", !existsSync(marker));
} finally {
  process.chdir(oldCwd);
  if (oldPath === undefined) delete process.env.DIEM_SCRIPT_PATH; else process.env.DIEM_SCRIPT_PATH = oldPath;
}

// ── Summary ─────────────────────────────────────────────────────────
console.log(`\n━━━ ${passed} passed, ${failed} failed ━━━`);
process.exit(failed > 0 ? 1 : 0);
