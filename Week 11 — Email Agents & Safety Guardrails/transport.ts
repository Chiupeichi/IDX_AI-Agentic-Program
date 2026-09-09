import { execFileSync } from "node:child_process";
import nodemailer from "nodemailer";
import type { EmailDraftRecord, EmailTransport } from "./types";

function requiredEmailUser() {
  const user = process.env.EMAIL_USER?.trim();
  if (!user) throw new Error("EMAIL_USER is required before an approved email can be sent");
  return user;
}

function resolveEmailPassword(user: string) {
  const directPassword = process.env.EMAIL_PASSWORD?.trim();
  if (directPassword) return directPassword;

  const service = process.env.EMAIL_PASSWORD_KEYCHAIN_SERVICE?.trim();
  if (process.platform === "darwin" && service) {
    try {
      const password = execFileSync(
        "/usr/bin/security",
        ["find-generic-password", "-s", service, "-a", user, "-w"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
      ).trim();
      if (password) return password;
    } catch {
      // Fall through to the actionable error below.
    }
  }

  throw new Error(
    "Email credential is missing. Configure EMAIL_PASSWORD or the named macOS Keychain item."
  );
}

export class NodemailerEmailTransport implements EmailTransport {
  async send(draft: EmailDraftRecord) {
    const user = requiredEmailUser();
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE?.trim() || "gmail",
      auth: {
        user,
        pass: resolveEmailPassword(user),
      },
    });
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM_NAME?.trim()
        ? { name: process.env.EMAIL_FROM_NAME.trim(), address: user }
        : user,
      to: draft.to,
      subject: draft.subject,
      text: draft.text,
      html: draft.html,
      headers: { "X-IDX-Draft-ID": draft.id },
    });
    return { messageId: result.messageId || `sent-${draft.id}` };
  }
}
