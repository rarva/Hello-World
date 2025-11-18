#!/usr/bin/env node
/**
 * User Migration Script for Supabase
 * ----------------------------------
 * Imports users from a JSON export file into Supabase using the Admin API.
 * Usage:
 *   1. Set SUPABASE_URL and SUPABASE_SERVICE_KEY (service_role) as env vars.
 *   2. Run: node migrate_users.js users_export.json
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  // Parse command-line arguments
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

  // Read Supabase credentials from environment
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service_role
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.');
    process.exit(2);
  }

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Read and parse user export file
  const raw = fs.readFileSync(file, 'utf8');
  let users = [];
  try {
    users = JSON.parse(raw);
  } catch (e) {
    console.error('Invalid JSON');
    process.exit(2);
  }

  // Convert object map to array if needed
  if (!Array.isArray(users)) {
    users = Object.keys(users).map(email => ({ email, stored: users[email] }));
  }

  // Migrate each user
  for (const u of users) {
    const email = u.email || (u.stored && u.stored.split(':')[0]);
    if (!email) continue;

    try {
      // Create user in Supabase Auth (default password: ChangeMe123!)
      const res = await supabase.auth.admin.createUser({ email, password: 'ChangeMe123!' });
      if (res.error) {
        console.error('Failed to create user', email, res.error.message);
        continue;
      }

      // Insert user profile row
      const userId = res.user.id;
      const { error: profileErr } = await supabase.from('profiles').insert([{ id: userId, email }]);
      if (profileErr) {
        console.error('Profile insert error for', email, profileErr.message);
      } else {
        console.log('Imported', email);
      }
    } catch (err) {
      // Catch and log any errors during migration
      console.error('Error importing', email, err.message || err);
    }
  }
}

// Run main migration function
main().catch(err => {
  console.error(err);
  process.exit(1);
});
