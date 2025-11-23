// Supabase Edge Function stub: manager-requests-create
// TODO: implement DB insert, token generation (raw token returned only in email), and call sendEmail

const { sendEmail } = require('../../../emails/server/sendEmail');
const crypto = require('crypto');

// This is a scaffold. Supabase Edge Functions usually use Deno or node; adapt as needed.
module.exports = async function handler(req, res) {
  try {
    const body = req.body || {};
    const requesterEmail = body.requesterEmail;
    const managerEmail = body.managerEmail;
    const requesterName = body.requesterName || '';

    if (!managerEmail || !requesterEmail) return res.status(400).json({ error: 'missing fields' });

    // Generate raw token and store only hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // TODO: INSERT into manager_validation_requests using SUPABASE_SERVICE_ROLE_KEY
    const requestId = 'TODO-INSERT-DB-RETURN-ID';

    // Build validate link: use your deployed URL base or env
    const base = process.env.APP_BASE_URL || 'http://localhost:3000';
    const validateLink = `${base}/manager-validate?token=${rawToken}`;

    // send email to manager (non-blocking ideally)
    await sendEmail('manager_notification', managerEmail, {
      requesterName,
      requesterEmail,
      managerEmail,
      managerName: managerEmail,
      validateLink,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      subject: 'Please review and validate a request',
    });

    return res.status(200).json({ requestId, sent: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
