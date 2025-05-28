'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Create a Supabase client for server components
export const createServerClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false
      }
    }
  );
};

// Server actions for authentication
export async function getSession() {
  const supabase = createServerClient();
  return await supabase.auth.getSession();
}

export async function signOut() {
  const supabase = createServerClient();
  return await supabase.auth.signOut();
}
