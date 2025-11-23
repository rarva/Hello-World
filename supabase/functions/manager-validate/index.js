// Supabase Edge Function stub: manager-validate
// Verifies token_hash and redirects manager to login/signup with locked email

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  try {
    const token = (req.query && req.query.token) || (req.body && req.body.token);
    if (!token) return res.status(400).send('Missing token');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // TODO: Query DB for pending request with token_hash === tokenHash and not expired
    const found = null; // replace with DB lookup
    if (!found) return res.status(404).send('Invalid or expired token');

    // Redirect manager to login with validateRequestId and lockedEmail
    const loginUrl = `/login?validateRequestId=${found.id}&lockedEmail=${encodeURIComponent(found.manager_email)}`;
    return res.redirect(loginUrl);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
};
