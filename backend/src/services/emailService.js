import nodemailer from 'nodemailer';

let cachedTransporter = null;

const smtpConfig = () => {
  const port = Number(process.env.SMTP_PORT || 587);
  return {
    host: process.env.SMTP_HOST,
    port,
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  };
};

const canSendViaBrevoApi = () => Boolean(process.env.BREVO_API_KEY && (process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM_EMAIL));
const canSendViaSmtp = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

export const canSendEmail = () => canSendViaBrevoApi() || canSendViaSmtp();

const getTransporter = () => {
  if (!canSendViaSmtp()) return null;
  if (!cachedTransporter) cachedTransporter = nodemailer.createTransport(smtpConfig());
  return cachedTransporter;
};

const sendViaBrevoApi = async ({ to, subject, html, text }) => {
  const fromName = process.env.BREVO_FROM_NAME || process.env.SMTP_FROM_NAME || process.env.STORE_NAME || "KIKI'S RETURN GIFT STORE";
  const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM_EMAIL;

  const response = await fetch(process.env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: fromName,
        email: fromEmail,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo email API failed: ${response.status} ${errorText}`);
  }

  return true;
};

const sendViaSmtp = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();
  if (!transporter) return false;

  const fromName = process.env.SMTP_FROM_NAME || process.env.STORE_NAME || "KIKI'S RETURN GIFT STORE";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
    text,
  });

  return true;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (canSendViaBrevoApi()) {
    return sendViaBrevoApi({ to, subject, html, text });
  }

  return sendViaSmtp({ to, subject, html, text });
};
