
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

  // Load Supabase library and initialize client
  const script = document.createElement('script');
  script.type = 'module';
  script.textContent = `
    import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
    window.supabase = createClient('${url}', '${anon}');
    console.log('Supabase client initialized successfully');
    window.supabaseReady = true;
    // Dispatch custom event to notify app
    window.dispatchEvent(new CustomEvent('supabaseReady'));
  `;
  document.head.appendChild(script);
})();
