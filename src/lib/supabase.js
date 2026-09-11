import { createClient } from '@supabase/supabase-js';

// Read credentials strictly from environment variables
let supabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 
  (typeof window !== 'undefined' && window.VITE_SUPABASE_URL) || 
  '';

let supabaseAnonKey = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 
  (typeof window !== 'undefined' && window.VITE_SUPABASE_ANON_KEY) || 
  '';

if (supabaseUrl) {
  supabaseUrl = supabaseUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}
if (supabaseAnonKey) {
  supabaseAnonKey = supabaseAnonKey.trim();
}

// Warning if environment variables are missing
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
  console.warn(
    '⚠️ [Supabase Setup Warning]: Missing or placeholder Supabase credentials in .env!\n' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Create reusable Supabase client instance (Public Anon Key ONLY)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'aavin_supabase_auth_token'
    }
  }
);

export default supabase;
