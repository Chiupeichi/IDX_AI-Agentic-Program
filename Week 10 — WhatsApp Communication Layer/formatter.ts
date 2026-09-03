import type { OrchestrationResult } from "../Week 9 — Multi-Agent Orchestration/types";

export const DEFAULT_WHATSAPP_CHUNK_LIMIT = 3_500;

function cleanText(value: string) {
  return value
    .replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

function addWhatsAppEmphasis(value: string) {
  return value
    .replace(/^(🏠 Property matches|📊 Market context)$/gm, "*$1*")
    .replace(/^(\d+\. 🏠 .+)$/gm, "*$1*")
    .replace(/^(EMAIL DRAFT — NOT SENT|EMAIL SENT|EMAIL CANCELLED)$/gm, "*$1*")
    .replace(/^(Status: pending(?:_| )approval|Status: sent|Status: cancelled)$/gm, "_$1_");
}

function splitLongBlock(block: string, limit: number) {
  const pieces: string[] = [];
  let remaining = block;
  while (remaining.length > limit) {
    let splitAt = remaining.lastIndexOf("\n", limit);
    if (splitAt < Math.floor(limit * 0.5)) splitAt = limit;
    pieces.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  if (remaining) pieces.push(remaining);
  return pieces;
}

export function chunkWhatsAppText(
  value: string,
  limit = DEFAULT_WHATSAPP_CHUNK_LIMIT
) {
  if (!Number.isInteger(limit) || limit < 200 || limit > 4_000) {
    throw new RangeError("WhatsApp chunk limit must be between 200 and 4000");
  }
  const text = cleanText(value);
  if (!text) return ["No results found."];

  const blocks = text.split(/\n{2,}/).flatMap((block) => splitLongBlock(block, limit));
  const messages: string[] = [];
  let current = "";
  for (const block of blocks) {
    const candidate = current ? `${current}\n\n${block}` : block;
    if (candidate.length <= limit) {
      current = candidate;
      continue;
    }
    if (current) messages.push(current);
    current = block;
  }
  if (current) messages.push(current);
  return messages;
}

export function formatForWhatsApp(
  result: OrchestrationResult,
  limit = DEFAULT_WHATSAPP_CHUNK_LIMIT
) {
  return chunkWhatsAppText(addWhatsAppEmphasis(result.response), limit);
}
