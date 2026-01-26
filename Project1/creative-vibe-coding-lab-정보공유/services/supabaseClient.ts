import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
  }
} else {
  console.warn('Supabase credentials missing or invalid. Comments will not be saved.');
}

// Export a wrapper or the client itself. 
// To avoid crashes in App.tsx, we can export a Proxy or a mock if client is null, 
// OR just export the client and handle null in App.tsx. 
// Given the user wants it fixed, let's export a safe dummy if null.

const dummyClient = {
  from: () => ({
    select: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
      })
    })
  })
} as unknown as SupabaseClient;

export const supabase = client || dummyClient;
