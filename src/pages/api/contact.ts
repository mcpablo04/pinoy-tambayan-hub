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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name = "", email = "", message = "", hp = "" } = req.body || {};

  // 1. Honeypot check: If 'hp' is filled, it's a bot.
  if (hp) {
    console.warn("Bot detected via honeypot.");
    return res.status(200).json({ ok: true }); 
  }

  // 2. Simple Validation
  if (!name.trim() || !email.trim() || !message.trim()) {
    return res.status(400).json({ error: "Please fill in all fields." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { 
        user: SMTP_USER, 
        pass: SMTP_PASS 
      },
      // Short timeout for serverless stability
      connectionTimeout: 5000, 
    });

    // 3. Construct Email content
    const subject = `📢 Tambayan Contact: ${name}`;
    const htmlBody = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">New Message from Hub</h2>
        <p><strong>Sender:</strong> ${name} (${email})</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="white-space: pre-wrap; color: #334155; line-height: 1.6;">
          ${escapeHtml(message)}
        </p>
      </div>
    `;

    // 4. Send the Mail
    await transporter.sendMail({
      from: MAIL_FROM || SMTP_USER,
      to: MAIL_TO,
      replyTo: email,
      subject,
      text: `From: ${name} <${email}>\n\n${message}`,
      html: htmlBody,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Mail Error:", err);
    return res.status(500).json({ error: "System busy. Please try again later." });
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}