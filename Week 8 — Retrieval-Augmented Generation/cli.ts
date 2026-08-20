import "dotenv/config";
import { answerRagQuestion, formatRagAnswer } from "./rag";

function argument(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const question = argument("question")?.trim();
  if (!question) {
    throw new Error(
      'Usage: npm run week8:ask -- --question "What does DOM mean?"'
    );
  }
  const rawTopK = argument("top-k");
  const topK = rawTopK === undefined ? 4 : Number(rawTopK);
  const result = await answerRagQuestion(question, {
    topK,
    indexPath: argument("index"),
  });
  console.log(formatRagAnswer(result));
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
