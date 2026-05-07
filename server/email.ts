import { Resend } from "resend";

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const PRIVATE_TYPE_LABELS: Record<string, string> = {
  question: "Question",
  prayer: "Prayer Request",
  help: "Help Request",
};

export async function sendNewRequestNotification(
  coordinatorEmail: string,
  coordinatorName: string,
  authorName: string,
  postType: string,
  postContent: string,
) {
  const resend = getResendClient();
  if (!resend) return;
  const typeLabel = PRIVATE_TYPE_LABELS[postType] ?? "Private Request";
  try {
    await resend.emails.send({
      from: "HostFamily Hub <onboarding@resend.dev>",
      to: coordinatorEmail,
      subject: `New ${typeLabel} from ${authorName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a2e;">
          <h2 style="color: #1e429f;">New ${typeLabel} on HostFamily Hub</h2>
          <p>Hi ${coordinatorName},</p>
          <p><strong>${authorName}</strong> has submitted a new ${typeLabel.toLowerCase()}:</p>
          <blockquote style="border-left: 3px solid #cbd5e1; margin: 12px 0; padding: 8px 16px; color: #64748b; font-style: italic;">
            ${postContent}
          </blockquote>
          <p>Log in to the Coordinator Dashboard to view and reply.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">HostFamily Hub — The Hospitality Center &amp; USA Homestays</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send new request email:", err);
  }
}

export async function sendReplyNotification(
  toEmail: string,
  toName: string,
  postContent: string,
  replyContent: string,
  coordinatorName: string,
) {
  const resend = getResendClient();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: "HostFamily Hub <onboarding@resend.dev>",
      to: toEmail,
      subject: "The coordinator replied to your request",
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a2e;">
          <h2 style="color: #1e429f;">You have a new reply on HostFamily Hub</h2>
          <p>Hi ${toName},</p>
          <p>${coordinatorName} has replied to your private request:</p>
          <blockquote style="border-left: 3px solid #cbd5e1; margin: 12px 0; padding: 8px 16px; color: #64748b; font-style: italic;">
            ${postContent}
          </blockquote>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <strong>${coordinatorName} wrote:</strong>
            <p style="margin: 8px 0 0;">${replyContent}</p>
          </div>
          <p>Log in to HostFamily Hub to see the full conversation and continue the discussion.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">HostFamily Hub — The Hospitality Center &amp; USA Homestays</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send reply email:", err);
  }
}
