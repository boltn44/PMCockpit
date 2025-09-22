import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log environment variables for debugging
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);
console.log('Supabase Key length:', supabaseAnonKey?.length || 0);

// Check if Supabase is properly configured with valid values
const isValidSupabaseUrl = supabaseUrl && 
  supabaseUrl !== 'undefined' && 
  supabaseUrl !== '' && 
  supabaseUrl.startsWith('http') &&
  supabaseUrl.includes('supabase.co');

const isValidSupabaseKey = supabaseAnonKey && 
  supabaseAnonKey !== 'undefined' && 
  supabaseAnonKey !== '' && 
  supabaseAnonKey.length > 20;

// Disable Supabase to use localStorage exclusively
export const isSupabaseConfigured = false;

console.log('isSupabaseConfigured:', isSupabaseConfigured);
console.log('URL valid:', isValidSupabaseUrl);
console.log('Key valid:', isValidSupabaseKey);

// Create a mock client if environment variables are missing
const createMockClient = () => ({
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
    update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
    delete: () => ({ error: { message: 'Supabase not configured' } }),
    upsert: () => ({ error: { message: 'Supabase not configured' } }),
    eq: function() { return this; },
    order: function() { return this; },
    limit: function() { return this; },
    single: function() { return this; },
  }),
});

export const supabase = (!isValidSupabaseUrl || !isValidSupabaseKey) 
  ? createMockClient() 
  : createClient(supabaseUrl, supabaseAnonKey);
