// Lightweight Supabase client initializer for a static site.
// This file creates a module script that imports the ESM Supabase bundle
// and attaches a `supabase` client to `window.supabase`.

(function(){
  const url = window.SUPABASE_URL || '';
  const anon = window.SUPABASE_ANON_KEY || '';

  // If no config is present, do nothing (keeps localStorage fallback working)
  if (!url || !anon) {
    console.warn('Supabase not configured. Falling back to localStorage.');
    return;
  }

  // Create a module script that imports createClient and sets window.supabase
  const moduleScript = document.createElement('script');
  moduleScript.type = 'module';
  moduleScript.textContent = `
    import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
    window.supabase = createClient(${JSON.stringify(url)}, ${JSON.stringify(anon)});
  `;
  document.head.appendChild(moduleScript);
})();
