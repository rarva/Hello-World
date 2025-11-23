// Supabase Edge Function stub: manager-requests-approve
// Authenticated endpoint: server must verify auth.user.email and set request to validated

module.exports = async function handler(req, res) {
  try {
    const body = req.body || {};
    const requestId = body.requestId;
    if (!requestId) return res.status(400).json({ error: 'missing requestId' });

    // TODO: verify supabase auth session and get auth.user.email
    const authUserEmail = 'TODO-AUTH-EMAIL';

    // TODO: fetch request row and verify manager_email === authUserEmail
    // TODO: update status to 'validated', set manager_user_id and validated_at
    // TODO: call sendEmail('manager_validated', requester_email, {...})

    return res.status(200).json({ requestId, status: 'validated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
