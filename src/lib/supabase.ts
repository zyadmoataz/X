import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration directly from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Log configuration for debugging
console.log('Supabase Configuration:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  envLoaded: !!process.env.NEXT_PUBLIC_SUPABASE_URL
});

// Log configuration for debugging
console.log('Supabase Configuration:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  envLoaded: !!process.env.NEXT_PUBLIC_SUPABASE_URL
});

// Validate URLs
if (!supabaseUrl || !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  console.error('Invalid Supabase URL:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Must start with http:// or https://');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  }
});

// Export a function to check initialization
export const checkSupabaseInit = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase auth error:', error);
      throw error;
    }

    console.log('Supabase initialized successfully:', {
      hasSession: !!data?.session,
      session: data?.session
    });
    return true;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    throw new Error('Failed to connect to Supabase. Check your configuration.');
  }
};

// Helper function for real-time subscriptions
export const subscribeToChannel = (
  channel: string,
  event: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(channel)
    .on('postgres_changes', { event, schema: 'public', table: channel }, callback)
    .subscribe();
};
