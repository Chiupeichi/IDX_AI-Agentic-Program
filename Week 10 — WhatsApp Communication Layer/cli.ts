import "dotenv/config";
import { closePool } from "../Week 03 — MLS Database Integration/mysql";
import { onWhatsAppMessage } from "./handler";

function argument(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const message = argument("message")?.trim();
  const userId = argument("user-id")?.trim();
  if (!message || !userId) {
    throw new Error(
      'Usage: npm run week10:message -- --message "Find homes in Irvine" --user-id "+15551234567"'
    );
  }
  const reply = await onWhatsAppMessage(message, userId);
  for (const messageChunk of reply.messages) console.log(messageChunk);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await closePool();
}
