import { AttackConfig, Vulnerability } from "./types.js";

export async function checkBaseline(config: AttackConfig): Promise<boolean> {
  try {
    const res = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.body
    });
    return res.ok || res.status < 400;
  } catch {
    return false;
  }
}

export async function testRaceCondition(config: AttackConfig): Promise<Vulnerability | null> {
  const concurrency = config.concurrency || 50;
  const promises = Array.from({ length: concurrency }).map(() => 
    fetch(config.url, { method: config.method, headers: config.headers, body: config.body })
  );

  const results = await Promise.allSettled(promises);
  let successCount = 0;
  
  for (const res of results) {
    if (res.status === "fulfilled" && (res.value.ok || res.value.status < 400)) {
      successCount++;
    }
  }

  if (successCount > 1 && config.method !== "GET") {
    const curlHeaderStr = Object.entries(config.headers).map(([k, v]) => `-H "${k}: ${v}"`).join(" ");
    return {
      severity: "CRITICAL",
      category: "RACE_CONDITION",
      title: "Concurrent State Mutation (Race Condition / TOCTOU)",
      description: `Fired ${concurrency} concurrent requests. ${successCount} requests succeeded simultaneously. Potential double-spend.`,
      reproductionCommand: `seq 1 ${concurrency} | xargs -n1 -P${concurrency} -I{} curl -s -X ${config.method} ${config.url} ${curlHeaderStr} -d '${config.body || ""}'`
    };
  }
  return null;
}

export async function testAuthBypass(config: AttackConfig): Promise<Vulnerability | null> {
  const strippedHeaders: Record<string, string> = { ...config.headers };
  delete strippedHeaders["authorization"];
  delete strippedHeaders["cookie"];

  const res = await fetch(config.url, { method: config.method, headers: strippedHeaders, body: config.body });
  if (res.ok || res.status < 400) {
    return {
      severity: "CRITICAL",
      category: "AUTH_BYPASS",
      title: "Unauthenticated Access Permitted",
      description: `Endpoint succeeded (${res.status}) without Auth headers.`,
      reproductionCommand: `curl -X ${config.method} ${config.url} -d '${config.body || ""}'`
    };
  }
  return null;
}

export async function testMassAssignment(config: AttackConfig): Promise<Vulnerability | null> {
  if (!config.body || config.method === "GET") return null;
  try {
    const mutated = { ...JSON.parse(config.body), isAdmin: true, role: "admin" };
    const res = await fetch(config.url, {
      method: config.method,
      headers: { ...config.headers, "content-type": "application/json" },
      body: JSON.stringify(mutated)
    });

    if (res.ok) {
      return {
        severity: "HIGH",
        category: "MASS_ASSIGNMENT",
        title: "Privilege Escalation via Mass Assignment",
        description: `Endpoint accepted unexpected privileged fields.`,
        reproductionCommand: `curl -X ${config.method} ${config.url} -H "Content-Type: application/json" -d '${JSON.stringify(mutated)}'`
      };
    }
  } catch {}
  return null;
}

export async function runFullAudit(config: AttackConfig): Promise<Vulnerability[]> {
  const vulns: Vulnerability[] = [];
  if (!(await checkBaseline(config))) return vulns;

  const race = await testRaceCondition(config);
  if (race) vulns.push(race);

  const auth = await testAuthBypass(config);
  if (auth) vulns.push(auth);

  const mass = await testMassAssignment(config);
  if (mass) vulns.push(mass);

  return vulns;
}
