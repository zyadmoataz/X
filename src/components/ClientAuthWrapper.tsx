'use client';

import React from 'react';
import LeftBar from '@/components/LeftBar';
import RightBar from '@/components/RightBar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export function ClientAuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/signup', '/register', '/login-debug'];
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // On public routes, just show the content without the layout
  if (isPublicRoute) {
    return <>{children}</>;
  }
  
  // If user is not authenticated and trying to access a protected route,
  // show a prompt to log in or sign up
  if (!user && !isPublicRoute) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-black p-4">
        <div className="mb-8">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-16 h-16 text-white">
            <g>
              <path
                fill="currentColor"
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              ></path>
            </g>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-6">See what's happening in the world right now</h1>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Link 
            href="/login" 
            className="w-full bg-white text-black font-bold py-2 px-4 rounded-full hover:bg-gray-200 transition duration-200 text-center"
          >
            Log in
          </Link>
          <Link 
            href="/signup"
            className="w-full border border-white text-white font-bold py-2 px-4 rounded-full hover:bg-white/10 transition duration-200 text-center"
          >
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  // For authenticated users on protected routes, show the full layout with proper spacing
  return (
    <div className="max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl xxl:max-w-screen-xxl mx-auto flex justify-between">
      <div className="px-2 xsm:px-4 xxl:px-8">
        <LeftBar />
      </div>
      {/* flex-1 to take all the remaining space */}
      <div className="flex-1 lg:min-w-[600px] border-x-[1px] border-borderGray">
        {children}
      </div>
      {/* Right sidebar - only visible on larger screens */}
      <div className="hidden lg:flex ml-4 md:ml-8 flex-1">
        <RightBar />
      </div>
    </div>
  );
}
