
/**
 * Supabase Client Initializer for Static Sites
 * --------------------------------------------
 * Loads Supabase client if config is present, otherwise falls back to localStorage.
 * This allows the app to run in demo mode without cloud auth.
 */
(function(){
  const url = window.SUPABASE_URL || '';
  const anon = window.SUPABASE_ANON_KEY || '';

  // If no config is present, do nothing (keeps localStorage fallback working)
  if (!url || !anon) {
    console.warn('Supabase not configured. Falling back to localStorage.');
    return;
  }

  // Dynamically create a module script to import Supabase and attach to window.supabase
  const moduleScript = document.createElement('script');
  moduleScript.type = 'module';
  moduleScript.textContent = `
    import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
    window.supabase = createClient(${JSON.stringify(url)}, ${JSON.stringify(anon)});
  `;
  document.head.appendChild(moduleScript);
})();
