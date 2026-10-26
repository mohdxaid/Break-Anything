import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { runFullAudit } from "./fuzzer.js";
import { AttackConfig } from "./types.js";

export async function startMcpServer(): Promise<void> {
  const server = new Server({ name: "break-anything-mcp", version: "0.1.0" }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: "break_anything_audit",
      description: "Run an autonomous security audit on a local endpoint to detect race conditions, auth bypasses, and mass assignment.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string" }, method: { type: "string" }, headers: { type: "object" }, body: { type: "string" }, concurrency: { type: "number" }
        },
        required: ["url", "method"]
      }
    }]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "break_anything_audit") {
      const config = request.params.arguments as AttackConfig;
      config.headers = config.headers || {};
      const vulns = await runFullAudit(config);
      return { content: [{ type: "text", text: JSON.stringify({ target: config.url, vulnerabilitiesFound: vulns.length, vulnerabilities: vulns }, null, 2) }] };
    }
    throw new Error(`Unknown tool`);
  });

  await server.connect(new StdioServerTransport());
}
