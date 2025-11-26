/*
Minimal test script to validate your SendGrid API key and `EMAIL_FROM`.
Usage (PowerShell):
  $env:SENDGRID_API_KEY='<NEW_KEY>'; $env:EMAIL_FROM='you@domain.com'; $env:TEST_TO='yourtest@domain.com'; node .\EMAILS\server\sendgrid_test.js

It sends a single test email and prints the SendGrid response status/body.
*/

async function main(){
  // Prefer the global fetch (Node 18+). Only dynamically import `node-fetch` when
  // no global `fetch` is available. This avoids a hard dependency for modern Node.
  let fetchImpl = globalThis.fetch;
  if (!fetchImpl) {
    try {
      const mod = await import('node-fetch');
      fetchImpl = mod.default || mod;
    } catch (e) {
      console.error('`fetch` is not available and `node-fetch` is not installed.');
      console.error('Install it with:');
      console.error('  npm init -y');
      console.error('  npm install node-fetch@3');
      process.exit(1);
    }
  }

  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM;
  const to = process.env.TEST_TO || process.env.TO || null;
  if (!key || !from || !to){
    console.error('Usage: set SENDGRID_API_KEY, EMAIL_FROM and TEST_TO in env then run this script.');
    process.exit(1);
  }

  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from },
    subject: 'SendGrid API Key Test',
    content: [{ type: 'text/plain', value: 'This is a test message to validate the SendGrid API key.' }]
  };

  try{
    const res = await fetchImpl('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text().catch(()=>'');
    console.log('SendGrid response status:', res.status);
    if (text) console.log('Response body:', text.slice(0,2000));
    if (res.ok || res.status === 202) console.log('SendGrid test OK (202)');
    else process.exit(2);
  }catch(err){
    console.error('Request failed', err && err.message);
    process.exit(3);
  }
}

main();
