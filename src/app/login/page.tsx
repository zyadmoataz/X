'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if already logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Already logged in - redirect to homepage
        window.location.href = '/';
      }
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Sign in directly with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Successful login - redirect immediately to homepage
      if (data?.session) {
        // Force a hard redirect to homepage
        window.location.href = '/';
      } else {
        throw new Error('Login failed: No session returned');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      <div className="w-full max-w-md bg-black rounded-lg border border-borderGray p-8">
        <div className="flex justify-center mb-8">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-12 h-12 text-white">
            <g>
              <path
                fill="currentColor"
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              ></path>
            </g>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Sign in to X</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-md text-red-500">
            {error}
          </div>
        )}
        
        
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 bg-black border border-borderGray rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3 py-2 bg-black border border-borderGray rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-bold py-2 px-4 rounded-full hover:bg-gray-200 transition duration-200 disabled:opacity-50 flex justify-center items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                  <span>Signing in...</span>
                </>
              ) : 'Sign in'}
            </button>
            
            <div className="mt-2">
              <Link href="/login-debug" className="text-sm text-blue-500 hover:underline">
                Having trouble? Try Debug Login
              </Link>
            </div>
          </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-500 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
