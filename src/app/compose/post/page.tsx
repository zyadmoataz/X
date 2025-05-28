'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Share from '@/components/Share';
import Link from 'next/link';

export default function ComposePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      if (!user) {
        console.log('No user found in compose page, redirecting to login');
        router.push('/login');
      } else {
        console.log('User authenticated in compose page:', user.username);
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Login Required</h1>
        <p className="text-textGray mb-6">You need to be logged in to create a post.</p>
        <Link 
          href="/login" 
          className="px-6 py-2 bg-blue-500 rounded-full font-bold"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-xl mx-auto border-x border-borderGray">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black bg-opacity-80 backdrop-blur-md px-4 py-3 border-b border-borderGray">
        <div className="flex items-center gap-6">
          <Link href="/" className="hover:bg-gray-800 p-2 rounded-full">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-white">
              <g>
                <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path>
              </g>
            </svg>
          </Link>
          <h1 className="text-xl font-bold">Create post</h1>
        </div>
      </div>
      
      {/* Share component */}
      <Share />
      
      {/* Helper text */}
      <div className="p-4 text-sm text-textGray border-t border-borderGray">
        <p>
          Add photos, videos, or create a poll to get more engagement. 
          Your post will appear on your profile and in your followers' feeds.
        </p>
      </div>
    </div>
  );
}
