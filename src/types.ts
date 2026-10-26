export interface AttackConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  concurrency?: number;
}

export interface Vulnerability {
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  category: "RACE_CONDITION" | "AUTH_BYPASS" | "MASS_ASSIGNMENT" | "INFO_LEAK";
  title: string;
  description: string;
  reproductionCommand: string;
}

export interface AttackReport {
  target: string;
  endpointsTested: number;
  vulnerabilitiesFound: Vulnerability[];
  durationMs: number;
}
