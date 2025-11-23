// Mailtrap provider wrapper using nodemailer for local testing
// Configure MAILTRAP_USER and MAILTRAP_PASS in env for SMTP auth

const nodemailer = require('nodemailer');

function transport() {
  const host = process.env.MAILTRAP_SMTP_HOST || 'smtp.mailtrap.io';
  const port = Number(process.env.MAILTRAP_SMTP_PORT || 2525);
  const user = process.env.MAILTRAP_USER;
  const pass = process.env.MAILTRAP_PASS;
  if (!user || !pass) throw new Error('MAILTRAP_USER and MAILTRAP_PASS required for mailtrap provider');
  return nodemailer.createTransport({ host, port, auth: { user, pass } });
}

async function send({ to, from, subject, html, text }) {
  const t = transport();
  const msg = {
    from: `${from.name || ''} <${from.email}>`,
    to,
    subject: subject || '',
    text: text || undefined,
    html: html || undefined,
  };
  return t.sendMail(msg);
}

module.exports = { send };
