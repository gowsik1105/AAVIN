/**
 * AAVIN SANGAM - Supabase Client Factory
 * Reusable Supabase client initialization reading strictly from environment variables
 */

(function () {
  // Check available environment credentials
  function getSupabaseEnv() {
    let url = '';
    let anonKey = '';

    // 1. Check window.__ENV__ or window global
    if (typeof window !== 'undefined') {
      if (window.__ENV__) {
        url = window.__ENV__.VITE_SUPABASE_URL || window.__ENV__.SUPABASE_URL || '';
        anonKey = window.__ENV__.VITE_SUPABASE_ANON_KEY || window.__ENV__.SUPABASE_ANON_KEY || '';
      }
      if (!url) url = window.VITE_SUPABASE_URL || window.AAVIN_SUPABASE_URL || '';
      if (!anonKey) anonKey = window.VITE_SUPABASE_ANON_KEY || window.AAVIN_SUPABASE_ANON_KEY || '';
      
      // Fallback to localStorage for custom developer overrides
      if (!url) url = localStorage.getItem('aavin_supabase_url') || '';
      if (!anonKey) anonKey = localStorage.getItem('aavin_supabase_anon_key') || '';
    }

    if (url) {
      url = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    }
    if (anonKey) {
      anonKey = anonKey.trim();
    }

    return { url, anonKey };
  }

  const { url, anonKey } = getSupabaseEnv();

  // Validate credentials
  const isMissing = !url || !anonKey || url.includes('your-project-id') || anonKey.includes('your-anon-public-key');
  if (isMissing) {
    console.warn(
      '⚠️ [Supabase Setup Warning]: Missing or placeholder Supabase credentials in .env!\n' +
      'Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    );
  }

  const defaultUrl = 'https://wmspmyhwsdefvvhwigav.supabase.co';
  const defaultKey = 'sb_publishable_IKBhtnA1pyeEKD_sVUQ0ug_0q2Aso5t';
  const validUrl = url || defaultUrl;
  const validKey = anonKey || defaultKey;

  // Initialize client if library is available
  let client = null;
  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      client = window.supabase.createClient(
        validUrl,
        validKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'aavin_supabase_auth_token'
          }
        }
      );
    } catch (e) {
      console.warn('Supabase client instantiation notice:', e);
    }
  }

  window.SUPABASE_CLIENT = client;
  window.getSupabaseClient = function () {
    return window.SUPABASE_CLIENT;
  };
})();
