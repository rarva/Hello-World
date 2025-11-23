// Provider-agnostic sendEmail helper
// Usage: const { sendEmail } = require('./sendEmail'); await sendEmail('manager_notification', 'me@example.com', { ... })

const path = require('path');
const fs = require('fs');

const providerName = process.env.EMAIL_PROVIDER || 'sendgrid';
let impl;
if (providerName === 'sendgrid') impl = require('./provider/sendgrid');
else if (providerName === 'mailtrap') impl = require('./provider/mailtrap');
else throw new Error('Unknown EMAIL_PROVIDER: ' + providerName);

function loadTemplate(templateName) {
  const tplDir = path.join(__dirname, 'templates');
  const htmlPath = path.join(tplDir, templateName + '.html');
  const txtPath = path.join(tplDir, templateName + '.txt');
  const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : null;
  const text = fs.existsSync(txtPath) ? fs.readFileSync(txtPath, 'utf8') : null;
  return { html, text };
}

function render(template, vars = {}) {
  if (!template) return null;
  let out = template;
  Object.keys(vars).forEach(k => {
    const re = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
    out = out.replace(re, vars[k]);
  });
  return out;
}

async function sendEmail(templateName, to, vars = {}) {
  if (!to) throw new Error('Recipient required');
  if (!templateName) throw new Error('Template name required');

  const tpl = loadTemplate(templateName);
  const subject = vars.subject || vars.title || 'Notification from App';
  const html = render(tpl.html, vars) || undefined;
  const text = render(tpl.text, vars) || undefined;
  const from = { email: process.env.EMAIL_FROM_ADDRESS, name: process.env.EMAIL_FROM_NAME };

  return impl.send({ to, from, subject, html, text });
}

module.exports = { sendEmail };
