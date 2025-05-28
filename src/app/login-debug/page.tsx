'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function DebugLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{text: string, type: 'error' | 'success' | 'info'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAuth, setCurrentAuth] = useState<any>(null);

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setCurrentAuth(data.session);
      
      if (data.session) {
        setMessage({
          text: 'Already logged in! Session details shown below. Click Go Home to proceed.',
          type: 'success'
        });
      }
    };
    
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);
    
    try {
      setMessage({
        text: `Attempting login with: ${email}`,
        type: 'info'
      });
      
      // Direct login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase login error:', error);
        setMessage({
          text: `Login error: ${error.message}`,
          type: 'error'
        });
        return;
      }

      if (data?.session) {
        setCurrentAuth(data.session);
        setMessage({
          text: 'Login successful! Click Go Home to proceed.',
          type: 'success'
        });
      } else {
        setMessage({
          text: 'No session returned after login',
          type: 'error'
        });
      }
    } catch (err: any) {
      console.error('Error during login:', err);
      setMessage({
        text: `Error: ${err.message || 'Failed to sign in'}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goHome = () => {
    window.location.href = '/';
  };

  const logOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setCurrentAuth(null);
      setMessage({
        text: 'Logged out successfully',
        type: 'success'
      });
    } catch (error: any) {
      setMessage({
        text: `Logout error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      <div className="w-full max-w-md bg-black rounded-lg border border-gray-700 p-8">
        <div className="flex justify-center mb-4">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-12 h-12 text-white">
            <g>
              <path
                fill="currentColor"
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              ></path>
            </g>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Debug Login</h1>
        <div className="mb-4 text-gray-400 text-sm text-center">
          This page bypasses middleware and context for direct login testing
        </div>
        
        {message && (
          <div className={`mb-4 p-3 border rounded-md ${
            message.type === 'error' ? 'bg-red-900/30 border-red-500 text-red-500' : 
            message.type === 'success' ? 'bg-green-900/30 border-green-500 text-green-500' :
            'bg-blue-900/30 border-blue-500 text-blue-500'
          }`}>
            {message.text}
          </div>
        )}

        {currentAuth ? (
          <div className="space-y-4">
            <div className="p-3 rounded bg-gray-900 text-gray-300 text-sm overflow-auto max-h-48">
              <strong>User ID:</strong> {currentAuth.user.id}<br/>
              <strong>Email:</strong> {currentAuth.user.email}<br/>
              <strong>Token:</strong> {currentAuth.access_token.substring(0, 20)}...
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={goHome}
                className="flex-1 bg-white text-black font-bold py-2 px-4 rounded-full hover:bg-gray-200 transition duration-200"
              >
                Go Home
              </button>
              
              <button
                onClick={logOut}
                disabled={isLoading}
                className="flex-1 bg-transparent border border-white text-white font-bold py-2 px-4 rounded-full hover:bg-white/10 transition duration-200"
              >
                Log Out
              </button>
            </div>
          </div>
        ) : (
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
                className="w-full px-3 py-2 bg-black border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 bg-black border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-bold py-2 px-4 rounded-full hover:bg-gray-200 transition duration-200 disabled:opacity-50 flex justify-center items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                  <span>Logging in...</span>
                </>
              ) : 'Debug Login'}
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            <Link href="/login" className="text-blue-500 hover:underline">
              Return to regular login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
