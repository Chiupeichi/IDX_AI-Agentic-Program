import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EmailDraftContent, EmailDraftRecord } from "./types";

export const DEFAULT_EMAIL_DRAFT_DIRECTORY = path.resolve(
  process.cwd(),
  ".data",
  "email-drafts"
);

const draftIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function hashUserId(userId: string) {
  const normalized = userId.trim();
  if (!normalized) throw new Error("userId is required");
  return createHash("sha256").update(normalized).digest("hex");
}

function validateDraftId(draftId: string) {
  const normalized = draftId.trim();
  if (!draftIdPattern.test(normalized)) {
    throw new Error("A valid email draft ID is required");
  }
  return normalized;
}

function validateStoredDraft(value: unknown): EmailDraftRecord {
  const draft = value as Partial<EmailDraftRecord>;
  if (
    !draft ||
    typeof draft.id !== "string" ||
    !draftIdPattern.test(draft.id) ||
    typeof draft.ownerHash !== "string" ||
    typeof draft.to !== "string" ||
    typeof draft.subject !== "string" ||
    typeof draft.text !== "string" ||
    typeof draft.html !== "string" ||
    typeof draft.status !== "string" ||
    typeof draft.createdAt !== "string" ||
    typeof draft.updatedAt !== "string"
  ) {
    throw new Error("Stored email draft is invalid");
  }
  return draft as EmailDraftRecord;
}

export class FileEmailDraftStore {
  constructor(private readonly directory = DEFAULT_EMAIL_DRAFT_DIRECTORY) {}

  private fileFor(draftId: string) {
    return path.join(this.directory, `${validateDraftId(draftId)}.json`);
  }

  private lockFor(draftId: string) {
    return path.join(this.directory, `${validateDraftId(draftId)}.lock`);
  }

  private async write(draft: EmailDraftRecord) {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const destination = this.fileFor(draft.id);
    const temporary = `${destination}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(draft, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporary, destination);
  }

  async create(userId: string, content: EmailDraftContent) {
    const now = new Date().toISOString();
    const draft: EmailDraftRecord = {
      ...content,
      id: randomUUID(),
      ownerHash: hashUserId(userId),
      status: "pending_approval",
      createdAt: now,
      updatedAt: now,
    };
    await this.write(draft);
    return draft;
  }

  async get(draftId: string, userId: string) {
    let draft: EmailDraftRecord;
    try {
      draft = validateStoredDraft(
        JSON.parse(await readFile(this.fileFor(draftId), "utf8"))
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error("Email draft was not found for this user");
      }
      throw error;
    }
    if (draft.ownerHash !== hashUserId(userId)) {
      throw new Error("Email draft was not found for this user");
    }
    return draft;
  }

  async save(draft: EmailDraftRecord, userId: string) {
    const existing = await this.get(draft.id, userId);
    if (draft.ownerHash !== existing.ownerHash) {
      throw new Error("Email draft ownership cannot be changed");
    }
    await this.write({ ...draft, updatedAt: new Date().toISOString() });
  }

  async withLock<T>(draftId: string, operation: () => Promise<T>) {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const lockPath = this.lockFor(draftId);
    let lock;
    try {
      lock = await open(lockPath, "wx", 0o600);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        throw new Error("This email draft is already being processed");
      }
      throw error;
    }

    try {
      return await operation();
    } finally {
      await lock.close();
      await unlink(lockPath).catch(() => undefined);
    }
  }
}
