# Diem Balance Plugin

Portable OpenClaw extension for checking a Venice AI Diem balance with `/diem`.

The plugin registers on startup, shells out to the bundled `diem.py`, and returns a compact balance line suitable for Telegram and other chat surfaces:

```text
**🪙 Venice Diem Balance:** `0.1234 Diem`
```

## Install

```bash
bash scripts/install.sh
```

Then restart OpenClaw Gateway and run:

```text
/diem
```

## Auth

No secrets are included. `diem.py` reads the local OpenClaw Venice auth profile from:

```text
~/.openclaw/agents/*/agent/auth-profiles.json
```

It expects a `venice:default` profile with a `key` value.

## Test

Offline baseline tests require no Venice credentials:

```bash
npm test
```

or directly:

```bash
node --experimental-strip-types extensions/diem/test.mjs
```
