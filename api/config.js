// Serverless endpoint that returns a small JS config blob using Vercel env vars
// This avoids committing secrets to repo. It is intended to be requested by the
// browser as `<script src="/api/config.js"></script>` so runtime client code
// sees `window.SUPABASE_URL` and `window.SUPABASE_ANON_KEY`.

module.exports = (req, res) => {
  try {
    // Only expose the anon key and URL — do NOT expose any service_role keys here.
    const url = process.env.SUPABASE_URL || '';
    const anon = process.env.SUPABASE_ANON_KEY || '';

    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    // Basic caching: let the browser cache for a short time; change in env requires deployment.
    res.setHeader('Cache-Control', 'public, max-age=60');

    const body = `// Generated config from server environment\n` +
      `window.SUPABASE_URL = ${JSON.stringify(url)};\n` +
      `window.SUPABASE_ANON_KEY = ${JSON.stringify(anon)};\n`;

    res.statusCode = 200;
    res.end(body);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.end("// config endpoint error\nwindow.SUPABASE_URL='';window.SUPABASE_ANON_KEY='';\n");
  }
};
