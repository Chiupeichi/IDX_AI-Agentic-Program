import { createDefaultAgentRegistry } from "./agents";
import { orchestrate as runOrchestrator } from "./orchestrator";

const agents = createDefaultAgentRegistry();

/** Single entry point used by OpenClaw and channel adapters. */
export async function orchestrate(query: string, userId: string) {
  return runOrchestrator(query, userId, agents);
}
