<div align="center">

# 💥 Break-Anything (`break-anything-mcp`)

**AI wrote your app in 10 minutes. `Break-Anything` hacks it in 60 seconds.**

[![CI](https://github.com/mohdxaid/break-anything/actions/workflows/ci.yml/badge.svg)](https://github.com/mohdxaid/break-anything/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-Native-success.svg)](https://modelcontextprotocol.io)

</div>

Millions of developers are currently "vibe-coding" web apps using AI coding agents. While AI writes code that passes happy-path tests, it frequently generates code with catastrophic hidden flaws:
- **Race Conditions (TOCTOU):** No database row-locking means two concurrent requests can double-spend a wallet balance.
- **Mass Assignment:** AI blindly merges JSON bodies into database updates, allowing users to pass `{"isAdmin": true}`.
- **Auth Bypasses:** Missing middleware on specific sub-routes.

`Break-Anything` is an autonomous chaos testing CLI and Model Context Protocol (MCP) server. You point it at an endpoint, and it fires 50 concurrent requests, mutates auth tokens, fuzzes payloads, and **hands the exact failing `curl` reproduction back to your AI coding agent to fix.**

## 🚀 Quickstart (The Viral Demo)

Experience a successful race-condition hack on your laptop in 5 seconds without installing anything:

```bash
# Downloads the package, spins up a vulnerable Express app, and executes a double-spend attack automatically
npx break-anything-mcp demo
```

## 🛠️ Attacking Local Code

Test any local endpoint running on your machine:

```bash
npx break-anything-mcp attack "http://localhost:3000/api/withdraw" \
  -X POST \
  -H "Authorization: Bearer my-token" \
  -d '{"amount": 10}' \
  --concurrency 100
```

## 🤖 Wiring to Claude Code / Cursor (MCP)

To let your AI agent automatically audit and fix vulnerabilities it creates:

1. Add to `~/.claude.json` or `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "break-anything": {
      "command": "npx",
      "args": ["-y", "break-anything-mcp", "mcp"]
    }
  }
}
```

2. Ask your agent:
> *"Run `break_anything_audit` on `http://localhost:3000/checkout`. If it finds a race condition, read the `curl` reproduction, figure out where my code is missing transactions/locking, and fix it."*

## How it works

1. **Race Condition Fuzzer:** It holds N network requests and releases them at the exact same millisecond. If a state-mutating request (like a withdrawal) succeeds multiple times concurrently for a single valid action, it flags a CRITICAL double-spend vulnerability.
2. **Auth Stripping:** Automatically duplicates the request while stripping headers (`Authorization`, `Cookie`, `x-api-key`) to detect missing middleware checks.
3. **Mass Assignment Fuzzer:** Injects elevated privileges (`role: admin`, `isAdmin: true`) into JSON payloads to see if the backend improperly sanitizes models.

## Development

```bash
git clone https://github.com/YOUR_USERNAME/break-anything
cd break-anything
npm install
npm run build
npm test

# Run CLI
node dist/cli.js demo
```

## License
MIT
