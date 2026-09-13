import "dotenv/config";
import { mergeEmbeddingIndexes, DEFAULT_INDEX_PATH } from "./indexStore";

function argument(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const inputs = process.argv.slice(2).filter((value, index, values) => {
  if (value === "--output") return false;
  if (index > 0 && values[index - 1] === "--output") return false;
  return !value.startsWith("--");
});

if (inputs.length < 2) {
  throw new Error(
    "Provide at least two segment index paths, optionally followed by --output <path>"
  );
}

const result = await mergeEmbeddingIndexes(
  inputs,
  argument("output") || DEFAULT_INDEX_PATH
);
console.log(`Merged ${result.listingCount} listings at ${result.outputPath}`);
