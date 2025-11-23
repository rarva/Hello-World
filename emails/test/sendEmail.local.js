// Local test runner for emails (Mailtrap or SendGrid from env)
// Usage: node emails/test/sendEmail.local.js

require('dotenv').config({ path: '../../.env' });
const { sendEmail } = require('../server/sendEmail');

async function main() {
  try {
    const to = process.env.TEST_RECEIVER || 'your-email@example.com';
    await sendEmail('manager_notification', to, {
      requesterName: 'Test Requester',
      requesterEmail: 'requester@example.com',
      managerEmail: to,
      managerName: 'Manager',
      validateLink: 'https://example.com/manager-validate?token=testtoken',
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      subject: 'Test: manager validation',
    });
    console.log('Test email sent (or enqueued) to', to);
  } catch (err) {
    console.error('Error sending test email', err);
    process.exit(1);
  }
}

main();
// Local test runner for emails/server/sendEmail.js
// Usage: set env vars (SENDGRID_API_KEY or SMTP_*) and run: node sendEmail.local.js

const path = require('path');
const { sendEmail } = require(path.join('..','server','sendEmail'));

(async function(){
  try {
    const res = await sendEmail('welcome', 'you@example.com', { userName: 'Local Tester', subject: 'Test Welcome' });
    console.log('Send result:', res);
  } catch (err) {
    console.error('Send failed:', err && err.message ? err.message : err);
  }
})();
