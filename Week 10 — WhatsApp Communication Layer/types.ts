import type { OrchestrationResult } from "../Week 9 — Multi-Agent Orchestration/types";

export type WhatsAppReply = {
  ok: boolean;
  intent: OrchestrationResult["intent"] | "error";
  agents: OrchestrationResult["agents"];
  messages: string[];
};

export type WhatsAppSessionStore = {
  restore(userId: string): Promise<void>;
  persist(userId: string): Promise<void>;
};
