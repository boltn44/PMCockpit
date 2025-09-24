import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Validate that the URL is a proper Supabase URL (not localhost)
if (!supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('supabase.in')) {
  throw new Error('VITE_SUPABASE_URL must be a valid remote Supabase URL');
}

// Log configuration for debugging (without exposing sensitive data)
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key configured:', !!supabaseAnonKey);

// Check if Supabase is properly configured with valid remote values
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  (supabaseUrl.includes('supabase.co') || supabaseUrl.includes('supabase.in')));

console.log('Supabase configured for remote connection:', isSupabaseConfigured);

// Create Supabase client with remote connection
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'pm-cockpit-app',
    },
  },
});

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('departments').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};