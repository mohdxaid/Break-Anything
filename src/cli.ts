#!/usr/bin/env node
import { Command } from "commander";
import { runFullAudit } from "./fuzzer.js";
import { startMcpServer } from "./mcp-server.js";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const program = new Command();

program.name("break-anything").description("Autonomous Chaos & Exploit Agent").version("0.1.0");

program
  .command("attack <url>")
  .option("-X, --method <method>", "HTTP Method", "POST")
  .option("-H, --header <header...>", "HTTP Headers")
  .option("-d, --body <body>", "JSON Body")
  .option("-c, --concurrency <number>", "Concurrency", "50")
  .action(async (url, opts) => {
    const headers: Record<string, string> = { "content-type": "application/json" };
    (opts.header || []).forEach((h: string) => { const [k, v] = h.split(":"); headers[k.trim()] = v.trim(); });
    const vulns = await runFullAudit({ url, method: opts.method, headers, body: opts.body, concurrency: Number(opts.concurrency) });
    console.log(JSON.stringify(vulns, null, 2));
  });

program
  .command("demo")
  .action(async () => {
    console.log("[*] Starting vulnerable vibe-coded local API...");
    const demoPath = path.join(__dirname, "..", "demo", "vulnerable-api.js");
    const api = spawn("node", [demoPath], { stdio: "pipe" });
    await new Promise(r => setTimeout(r, 1000));
    console.log("[*] Launching autonomous attack against Race Condition endpoint...");
    try {
      const vulns = await runFullAudit({ url: "http://localhost:3000/api/withdraw", method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amount: 100, transactionId: "tx-1234" }), concurrency: 20 });
      console.log(`\n[!] EXPLOIT SUCCESSFUL\n`);
      vulns.forEach(v => console.log(`[🚨 ${v.severity}] ${v.title}\n    ${v.description}`));
    } finally { api.kill(); }
  });

program.command("mcp").action(async () => await startMcpServer());
program.parseAsync(process.argv);
