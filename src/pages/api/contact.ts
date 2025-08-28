// /src/pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT = "465",
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
  MAIL_TO,
} = process.env;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name = "", email = "", message = "", hp = "" } = req.body || {};

  // simple validation + honeypot
  if (hp) return res.status(200).json({ ok: true }); // bot trap
  if (!name.trim() || !email.trim() || !message.trim()) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // true for 465, false for 587
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const subject = `New message from ${name} (Contact Form)`;
    const text = `From: ${name} <${email}>\n\n${message}`;
    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        <pre style="white-space:pre-wrap;margin:0">${escapeHtml(message)}</pre>
      </div>
    `;

    await transporter.sendMail({
      from: MAIL_FROM || SMTP_USER,
      to: MAIL_TO,           // <- your private inbox from env
      replyTo: email,        // so you can reply directly
      subject,
      text,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("contact:sendMail", err);
    return res.status(500).json({ error: "Failed to send" });
  }
}

// tiny HTML escaper for safety
function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
