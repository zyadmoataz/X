'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Helper function to fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  };

  useEffect(() => {
    // Check active session
    const setupAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error fetching session:', error);
        setIsLoading(false);
        return;
      }
      
      if (data && data.session) {
        setSession(data.session);
        
        // Fetch user profile data and combine with auth user
        const userProfile = await fetchUserProfile(data.session.user.id);
        const enhancedUser = {
          ...data.session.user,
          ...userProfile
        };
        
        setUser(enhancedUser as User);
      }
      
      setIsLoading(false);
      
      // Listen for auth changes
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session);
          
          if (session?.user) {
            // Fetch user profile data and combine with auth user
            const userProfile = await fetchUserProfile(session.user.id);
            const enhancedUser = {
              ...session.user,
              ...userProfile
            };
            
            setUser(enhancedUser as User);
          } else {
            setUser(null);
          }
          
          router.refresh();
        }
      );

      return () => {
        authListener?.subscription.unsubscribe();
      };
    };

    setupAuth();
  }, [router]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Get user profile data
      if (data?.user) {
        const userProfile = await fetchUserProfile(data.user.id);
        const enhancedUser = {
          ...data.user,
          ...userProfile
        };
        
        // Update state
        setSession(data.session);
        setUser(enhancedUser as User);
      }
      
      // Navigate home
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string, name: string) => {
    setIsLoading(true);
    try {
      // First, check if username already exists to prevent conflicts
      const { data: existingUser, error: usernameError } = await supabase
        .from('users')
        .select('username')
        .eq('username', username);
      
      if (usernameError) {
        console.error('Error checking username:', usernameError);
      } else if (existingUser && existingUser.length > 0) {
        throw new Error('Username already taken');
      }

      // Create the user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            name,
          },
          // Important: This will automatically create a user entry in the users table
          // through Supabase's database triggers if you've set them up.
          // You can set this up in Supabase SQL Editor or Auth Settings
        },
      });

      if (error) throw error;
      
      // Simply notify user to check email if email confirmation is enabled
      // or redirect to login if not
      alert('Signup successful! You can now log in.');
      router.push('/login');
    } catch (error: any) {
      console.error('Error signing up:', error);
      alert(error.message || 'Failed to sign up. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
