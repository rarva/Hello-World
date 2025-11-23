// emails/server/provider/smtp.js
// Lightweight nodemailer SMTP wrapper (server-side)

const nodemailer = require('nodemailer');

async function send({ to, from, fromName, subject, html }) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error('SMTP env vars missing');

  const transporter = nodemailer.createTransport({ host, port, auth: { user, pass }, secure: port === 465 });
  const fromHeader = fromName ? `${fromName} <${from}>` : from;
  const info = await transporter.sendMail({ from: fromHeader, to, subject, html });
  return info;
}

module.exports = { send };
