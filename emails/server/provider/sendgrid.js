// SendGrid provider wrapper
// Exports a `send({ to, from, subject, html, text })` function.
// Note: do NOT include API keys in the repo. Set SENDGRID_API_KEY in environment/secrets.

const sgMail = require('@sendgrid/mail');
if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function send({ to, from, subject, html, text }) {
  if (!process.env.SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY not set');
  const msg = {
    to,
    from: { email: from.email, name: from.name },
    subject: subject || '',
    html: html || undefined,
    text: text || undefined,
  };
  return sgMail.send(msg);
}

module.exports = { send };
// emails/server/provider/sendgrid.js
// Minimal SendGrid provider wrapper for server-side usage

const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

async function send({ to, from, fromName, subject, html }) {
  if (!process.env.SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY not set');
  const msg = {
    to,
    from: fromName ? `${fromName} <${from}>` : from,
    subject: subject || 'Notification',
    html
  };
  return sgMail.send(msg);
}

module.exports = { send };
