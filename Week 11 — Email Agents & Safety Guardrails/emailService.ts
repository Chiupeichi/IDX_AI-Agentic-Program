import { FileEmailDraftStore } from "./draftStore";
import { NodemailerEmailTransport } from "./transport";
import type {
  EmailDraftContent,
  EmailDraftRecord,
  EmailTransport,
} from "./types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContent(content: EmailDraftContent) {
  const to = content.to.trim().toLowerCase();
  const subject = content.subject.trim();
  const text = content.text.trim();
  const html = content.html.trim();
  if (!emailPattern.test(to)) throw new Error("A valid recipient email address is required");
  if (!subject || subject.length > 200 || /[\r\n]/.test(subject)) {
    throw new Error("Email subject must contain 1 to 200 characters");
  }
  if (!text || !html) throw new Error("Email body is required");
  return { ...content, to, subject, text, html };
}

export async function draftEmail(
  userId: string,
  content: EmailDraftContent,
  options: { store?: FileEmailDraftStore } = {}
) {
  const store = options.store ?? new FileEmailDraftStore();
  return store.create(userId, validateContent(content));
}

export async function approveEmail(
  draftId: string,
  userId: string,
  options: { store?: FileEmailDraftStore } = {}
) {
  const store = options.store ?? new FileEmailDraftStore();
  return store.withLock(draftId, async () => {
    const draft = await store.get(draftId, userId);
    if (draft.status === "sent") throw new Error("This email has already been sent");
    if (draft.status === "cancelled") throw new Error("A cancelled email cannot be approved");
    if (draft.status === "sending") throw new Error("This email is already being sent");
    if (draft.status === "approved") return draft;
    const approved: EmailDraftRecord = {
      ...draft,
      status: "approved",
      approvedAt: new Date().toISOString(),
      lastError: undefined,
    };
    await store.save(approved, userId);
    return approved;
  });
}

export async function cancelEmail(
  draftId: string,
  userId: string,
  options: { store?: FileEmailDraftStore } = {}
) {
  const store = options.store ?? new FileEmailDraftStore();
  return store.withLock(draftId, async () => {
    const draft = await store.get(draftId, userId);
    if (draft.status === "sent") throw new Error("A sent email cannot be cancelled");
    if (draft.status === "sending") throw new Error("An email being sent cannot be cancelled");
    const cancelled: EmailDraftRecord = { ...draft, status: "cancelled" };
    await store.save(cancelled, userId);
    return cancelled;
  });
}

export async function sendApprovedEmail(
  draftId: string,
  userId: string,
  options: {
    store?: FileEmailDraftStore;
    transport?: EmailTransport;
  } = {}
) {
  const store = options.store ?? new FileEmailDraftStore();
  return store.withLock(draftId, async () => {
    const draft = await store.get(draftId, userId);
    if (draft.status !== "approved") {
      if (draft.status === "sent") throw new Error("This email has already been sent");
      throw new Error("Email must have explicit human approval before sending");
    }

    const sending: EmailDraftRecord = { ...draft, status: "sending" };
    await store.save(sending, userId);
    let receipt;
    try {
      const transport = options.transport ?? new NodemailerEmailTransport();
      receipt = await transport.send(sending);
    } catch {
      const failed: EmailDraftRecord = {
        ...sending,
        status: "failed",
        lastError: "delivery_failed",
      };
      await store.save(failed, userId);
      throw new Error(
        "Email delivery failed. Review the draft and explicitly approve it again before retrying."
      );
    }

    // If this final state write fails after SMTP accepted the message, the stored status
    // intentionally remains `sending`. That blocks automatic retry and possible duplicates.
    const sent: EmailDraftRecord = {
      ...sending,
      status: "sent",
      sentAt: new Date().toISOString(),
      messageId: receipt.messageId,
    };
    await store.save(sent, userId);
    return sent;
  });
}

export async function approveAndSendEmail(
  draftId: string,
  userId: string,
  options: {
    store?: FileEmailDraftStore;
    transport?: EmailTransport;
  } = {}
) {
  await approveEmail(draftId, userId, options);
  return sendApprovedEmail(draftId, userId, options);
}

export function formatDraftPreview(draft: EmailDraftRecord) {
  return `EMAIL DRAFT — NOT SENT
Status: pending_approval
Draft ID: ${draft.id}
To: ${draft.to}
Subject: ${draft.subject}

${draft.text}

To send exactly this draft, reply: Approve email ${draft.id}
To discard it, reply: Cancel email ${draft.id}`;
}

export function formatSentConfirmation(draft: EmailDraftRecord) {
  return `EMAIL SENT
Draft ID: ${draft.id}
To: ${draft.to}
Subject: ${draft.subject}
Status: sent`;
}
