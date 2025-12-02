import { NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const supportInbox = process.env.SUPPORT_INBOX ?? "helpdesk@studyatra.in";
const supportFromEmail =
  process.env.SUPPORT_FROM_EMAIL ?? "support@studyatra.in";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function POST(request: Request) {
  if (!resend) {
    console.error("RESEND_API_KEY is not configured.");
    return NextResponse.json(
      {
        error:
          "Email service is not configured. Please contact support through email directly.",
      },
      { status: 500 }
    );
  }

  try {
    const { name, email, message } = await request.json();

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !message.trim()
    ) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    await resend.emails.send({
      from: `Studyatra Helpdesk <${supportFromEmail}>`,
      replyTo: trimmedEmail,
      to: supportInbox,
      subject: `New contact request from ${trimmedName}`,
      text: [
        `A new message was submitted via the contact form.`,
        "",
        `Name: ${trimmedName}`,
        `Email: ${trimmedEmail}`,
        "",
        `Message:`,
        trimmedMessage,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif;">
          <p>A new message was submitted via the contact form.</p>
          <p><strong>Name:</strong> ${escapeHtml(trimmedName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(trimmedEmail)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(trimmedMessage).replace(/\n/g, "<br />")}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send contact email", error);
    return NextResponse.json(
      { error: "Something went wrong while sending your message." },
      { status: 500 }
    );
  }
}
