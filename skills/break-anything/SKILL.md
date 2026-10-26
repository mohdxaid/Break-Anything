---
name: break-anything
description: Invoke this skill to automatically audit a local or remote endpoint for race conditions (TOCTOU), mass assignment, and auth bypasses. If vulnerabilities are found, the agent should use the reproduction curl command to verify and patch the code.
---
# Break-Anything Agent Skill

## Commands
1. Run local demo: `npx break-anything-mcp demo`
2. Attack endpoint: `npx break-anything-mcp attack <url> -X POST -d '{"amount": 10}'`
3. MCP Tool: `break_anything_audit`
