import { User as SupabaseUser } from '@supabase/supabase-js';

// Extended User type that includes profile information
export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar_url: string;
  bio: string;
  followers_count: number;
  following_count: number;
  created_at?: string;
}

// Combine Supabase User with our UserProfile
export type User = SupabaseUser & Partial<UserProfile>;
