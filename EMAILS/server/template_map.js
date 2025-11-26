// Server-side mapping of friendly template aliases to SendGrid template GUIDs.
// Keep GUIDs non-secret — they identify templates but are safe to store in repo.
// Update this mapping via PR when you publish new templates in SendGrid.

const mapping = {
  // Example entry:
  // "manager_notification": {
  //   "production": "11111111-2222-3333-4444-555555555555",
  //   "preview": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
  // }
  // Add your real template GUIDs here.
};

function getEnvKey() {
  // Vercel exposes VERCEL_ENV as 'production' | 'preview' | 'development'
  return (process.env.VERCEL_ENV || process.env.NODE_ENV || 'production');
}

export function resolveTemplate(alias) {
  if (!alias || typeof alias !== 'string') return null;
  const entry = mapping[alias];
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  const env = getEnvKey();
  return entry[env] || entry.production || null;
}

export function listAliases() {
  return Object.keys(mapping);
}
