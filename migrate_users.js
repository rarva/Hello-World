#!/usr/bin/env node
// Simple migration script to import users from a JSON export into Supabase
// Usage: set SUPABASE_URL and SUPABASE_SERVICE_KEY (service_role) as env vars,
// then: node migrate_users.js users_export.json

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node migrate_users.js users_export.json');
    process.exit(2);
  }
  const file = path.resolve(args[0]);
  if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    process.exit(2);
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service_role
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.');
    process.exit(2);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const raw = fs.readFileSync(file, 'utf8');
  let users = [];
  try { users = JSON.parse(raw); } catch (e) { console.error('Invalid JSON'); process.exit(2); }

  // Expecting users format: { "email": "email:password", ... } or an array
  if (!Array.isArray(users)) {
    // convert object map -> array
    users = Object.keys(users).map(email => ({ email, stored: users[email] }));
  }

  for (const u of users) {
    const email = u.email || (u.stored && u.stored.split(':')[0]);
    if (!email) continue;

    try {
      // Create a user via Admin API (service_role) - create_user method
      const res = await supabase.auth.admin.createUser({ email, password: 'ChangeMe123!' });
      if (res.error) {
        console.error('Failed to create user', email, res.error.message);
        continue;
      }

      const userId = res.user.id;
      // Insert profile row
      const { error: profileErr } = await supabase.from('profiles').insert([{ id: userId, email }]);
      if (profileErr) console.error('Profile insert error for', email, profileErr.message);
      else console.log('Imported', email);
    } catch (err) {
      console.error('Error importing', email, err.message || err);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
