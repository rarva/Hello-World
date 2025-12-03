// Placeholder config.js — NO SECRETS HERE
// This file exists only to avoid a 404 when the app tries to load `/config.js`.
// Do NOT commit real Supabase keys or service secrets into this file in a public repo.

// If you want runtime credentials in production, configure Vercel environment variables
// and generate a `config.js` during the build or use server-side endpoints.

window.SUPABASE_URL = window.SUPABASE_URL || '';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';
window.SUPABASE_SERVICE_KEY = window.SUPABASE_SERVICE_KEY || '';

// Optional app-level defaults
window.APP_CONFIG = window.APP_CONFIG || {};

console.warn('config.js placeholder loaded. No Supabase credentials are set.');
