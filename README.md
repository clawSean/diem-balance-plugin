# 🪙 Diem Balance Plugin

> **Zero-token Venice AI balance checks — right from your OpenClaw agent.**

No LLM inference. No token burn. Just a clean `/diem` command that pings the Venice API and reports your remaining Diem balance instantly.

```
/diem
```
```
🪙 Venice Diem Balance: `3.5012 Diem`
```

---

## ✨ Features

- ⚡ **Zero-token** — makes a minimal 1-token inference request just to read balance headers
- 🚀 **Startup-registered** — available immediately when OpenClaw boots
- 📦 **Portable** — single folder, no secrets bundled, works on any machine with OpenClaw
- 🧪 **Tested** — 15 offline baseline tests, no credentials required to run them
- 🔌 **Drop-in install** — one `bash` command and a gateway restart

---

## 📦 Install

```bash
bash scripts/install.sh
```

Then restart OpenClaw Gateway:

```bash
openclaw gateway restart
```

Run it:

```
/diem
```

> **Default install path:** `~/.openclaw/extensions/diem`
> Override with `OPENCLAW_EXT_DIR=/your/path bash scripts/install.sh`

---

## 🔐 Auth

No secrets are included in this repo. The plugin reads your Venice AI API key from the OpenClaw auth profile already on your machine:

```
~/.openclaw/agents/*/agent/auth-profiles.json
```

It expects a `venice:default` profile with a `key` field — the same one OpenClaw uses for Venice inference. If you're already running Venice models, this just works.

---

## 🗂️ Structure

```
diem-balance-plugin/
├── extensions/
│   └── diem/
│       ├── openclaw.plugin.json   # Plugin manifest
│       ├── index.ts               # Command registration + output formatting
│       ├── diem.py                # Python script — hits Venice API for balance headers
│       └── test.mjs               # Offline baseline test suite
├── scripts/
│   └── install.sh                 # Copies plugin files into OpenClaw extensions dir
├── INSTRUCTIONS.md                # Human-readable install guide
└── package.json                   # npm test entry point
```

---

## 🧪 Tests

Offline — no Venice credentials needed:

```bash
npm test
```

```
▸ Manifest          PASS ×4
▸ Entry point       PASS ×1
▸ Registration      PASS ×4
▸ formatBalance     PASS ×5
▸ diem.py syntax    PASS ×1

━━━ 15 passed, 0 failed ━━━
```

---

## 🛠️ How It Works

1. `/diem` is registered as a zero-arg OpenClaw command on startup
2. `index.ts` shells out to `diem.py` via `execSync`
3. `diem.py` sends a minimal 1-token request to `https://api.venice.ai` and reads the response headers
4. The `x-venice-balance-diem` header value is parsed and formatted
5. Result is returned to the chat surface

---

## 🔗 Links

- [Venice AI](https://venice.ai) — the inference provider
- [OpenClaw](https://openclaw.ai) — the agent platform this plugin targets
- [clawSean on GitHub](https://github.com/clawSean) — org this plugin lives under
