import { execFileSync } from "node:child_process";
import OpenAI from "openai";

export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
export const DEFAULT_EMBEDDING_DIMENSIONS = 512;

export interface EmbeddingProvider {
  readonly model: string;
  readonly dimensions: number;
  embed(texts: readonly string[]): Promise<number[][]>;
}

function positiveInteger(value: string | undefined, fallback: number) {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("OPENAI_EMBEDDING_DIMENSIONS must be a positive integer");
  }
  return parsed;
}

function resolveApiKey() {
  const directKey = process.env.OPENAI_API_KEY?.trim();
  if (directKey) return directKey;

  const service = process.env.OPENAI_API_KEY_KEYCHAIN_SERVICE?.trim();
  if (process.platform === "darwin" && service) {
    const account = process.env.OPENAI_API_KEY_KEYCHAIN_ACCOUNT?.trim();
    const args = ["find-generic-password", "-s", service];
    if (account) args.push("-a", account);
    args.push("-w");

    try {
      const key = execFileSync("/usr/bin/security", args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (key) return key;
    } catch {
      // Fall through to the actionable error below.
    }
  }

  throw new Error(
    "OpenAI API key is missing. Set OPENAI_API_KEY or configure the named macOS Keychain item."
  );
}

export function normalizeEmbeddingText(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim().slice(0, 8_000);
  if (!normalized) throw new Error("Embedding input cannot be empty");
  return normalized;
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly model: string;
  readonly dimensions: number;
  private readonly client: OpenAI;

  constructor(options: {
    apiKey?: string;
    model?: string;
    dimensions?: number;
  } = {}) {
    this.model =
      options.model?.trim() ||
      process.env.OPENAI_EMBEDDING_MODEL?.trim() ||
      DEFAULT_EMBEDDING_MODEL;
    this.dimensions =
      options.dimensions ??
      positiveInteger(
        process.env.OPENAI_EMBEDDING_DIMENSIONS,
        DEFAULT_EMBEDDING_DIMENSIONS
      );
    this.client = new OpenAI({ apiKey: options.apiKey?.trim() || resolveApiKey() });
  }

  async embed(texts: readonly string[]) {
    if (texts.length < 1) throw new Error("At least one embedding input is required");
    const input = texts.map(normalizeEmbeddingText);
    const response = await this.client.embeddings.create({
      model: this.model,
      input,
      dimensions: this.dimensions,
      encoding_format: "float",
    });

    const embeddings = [...response.data]
      .sort((left, right) => left.index - right.index)
      .map((item) => item.embedding);

    if (embeddings.length !== input.length) {
      throw new Error("OpenAI returned an unexpected number of embeddings");
    }
    for (const embedding of embeddings) {
      if (
        embedding.length !== this.dimensions ||
        embedding.some((value) => !Number.isFinite(value))
      ) {
        throw new Error("OpenAI returned an invalid embedding vector");
      }
    }
    return embeddings;
  }
}

export function cosineSimilarity(left: readonly number[], right: readonly number[]) {
  if (left.length === 0 || left.length !== right.length) {
    throw new Error("Embedding vectors must have the same non-zero dimensions");
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];
    if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) {
      throw new Error("Embedding vectors must contain finite numbers");
    }
    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) return 0;
  return dotProduct / Math.sqrt(leftMagnitude * rightMagnitude);
}
