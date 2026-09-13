import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { KnowledgeDocument } from "./types";

export const DEFAULT_KNOWLEDGE_DIRECTORY = path.resolve(
  process.cwd(),
  "Week 08 — Retrieval-Augmented Generation",
  "knowledge"
);

function titleFromMarkdown(content: string, fallback: string) {
  return /^#\s+(.+)$/m.exec(content)?.[1]?.trim() || fallback;
}

export async function loadKnowledgeDocuments(
  directory = DEFAULT_KNOWLEDGE_DIRECTORY
): Promise<KnowledgeDocument[]> {
  const resolvedDirectory = path.resolve(directory);
  const names = (await readdir(resolvedDirectory))
    .filter((name) => name.toLowerCase().endsWith(".md"))
    .sort();
  if (names.length === 0) throw new Error("No Markdown knowledge documents were found");

  return Promise.all(
    names.map(async (name) => {
      const absolutePath = path.join(resolvedDirectory, name);
      const content = (await readFile(absolutePath, "utf8")).trim();
      if (!content) throw new Error(`Knowledge document is empty: ${name}`);
      return {
        id: path.basename(name, path.extname(name)),
        title: titleFromMarkdown(content, name),
        sourcePath: path.relative(process.cwd(), absolutePath),
        content,
      };
    })
  );
}
