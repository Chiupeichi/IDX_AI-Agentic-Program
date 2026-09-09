export type EmailUseCase =
  | "listing_alert"
  | "weekly_market_report"
  | "property_summary"
  | "recommendation_digest";

export type EmailDraftStatus =
  | "pending_approval"
  | "approved"
  | "sending"
  | "sent"
  | "failed"
  | "cancelled";

export type EmailDraftContent = {
  to: string;
  subject: string;
  text: string;
  html: string;
  useCase: EmailUseCase;
};

export type EmailDraftRecord = EmailDraftContent & {
  id: string;
  ownerHash: string;
  status: EmailDraftStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  sentAt?: string;
  messageId?: string;
  lastError?: "delivery_failed";
};

export type EmailSendReceipt = {
  messageId: string;
};

export interface EmailTransport {
  send(draft: EmailDraftRecord): Promise<EmailSendReceipt>;
}
