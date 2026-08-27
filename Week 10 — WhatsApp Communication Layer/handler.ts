import { orchestrate as defaultOrchestrate } from "../Week 9 — Multi-Agent Orchestration/entrypoint";
import type { OrchestrationResult } from "../Week 9 — Multi-Agent Orchestration/types";
import { formatForWhatsApp } from "./formatter";
import { FileWhatsAppSessionStore } from "./sessionStore";
import type { WhatsAppReply, WhatsAppSessionStore } from "./types";

export type WhatsAppHandlerOptions = {
  orchestrate?: (query: string, userId: string) => Promise<OrchestrationResult>;
  sessionStore?: WhatsAppSessionStore;
  sendTypingIndicator?: (userId: string) => Promise<void>;
  chunkLimit?: number;
  onError?: (error: unknown) => void;
};

const fallbackMessage = "Sorry, I hit an issue. Please try again.";

export async function onWhatsAppMessage(
  message: string,
  userId: string,
  options: WhatsAppHandlerOptions = {}
): Promise<WhatsAppReply> {
  const normalizedMessage = message.trim();
  const normalizedUserId = userId.trim();
  if (!normalizedMessage || !normalizedUserId) {
    return {
      ok: false,
      intent: "error",
      agents: [],
      messages: [fallbackMessage],
    };
  }

  try {
    await options.sendTypingIndicator?.(normalizedUserId);
  } catch (error) {
    options.onError?.(error);
  }

  const sessionStore =
    options.sessionStore ?? new FileWhatsAppSessionStore();
  const orchestrate = options.orchestrate ?? defaultOrchestrate;

  try {
    await sessionStore.restore(normalizedUserId);
    const result = await orchestrate(normalizedMessage, normalizedUserId);
    await sessionStore.persist(normalizedUserId);
    return {
      ok: true,
      intent: result.intent,
      agents: result.agents,
      messages: formatForWhatsApp(result, options.chunkLimit),
    };
  } catch (error) {
    options.onError?.(error);
    return {
      ok: false,
      intent: "error",
      agents: [],
      messages: [fallbackMessage],
    };
  }
}
