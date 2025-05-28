'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Post from '@/components/Post';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Image from '@/components/Image';
import Link from 'next/link';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { user } = useAuth();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasResults, setHasResults] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      
      setLoading(true);
      try {
        // Get from Supabase
        let postsData: any[] = [];
        
        // If query is a hashtag (with or without #)
        const searchTerm = query.startsWith('#') ? query.substring(1) : query;
        
        console.log('Searching for:', searchTerm);
        
        // Search in posts content with proper SQL LIKE syntax
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            users!posts_user_id_fkey(id, username, name, avatar_url)
          `)
          .or(`content.ilike.%${searchTerm}%,content.ilike.%#${searchTerm}%`)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching search results:', error);
          alert('Error fetching search results: ' + error.message);
          postsData = [];
        } else {
          console.log('Search results:', data);
          postsData = data || [];
        }
        
        setPosts(postsData);
        setHasResults(postsData.length > 0);
      } catch (err) {
        console.error('Error in search:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [query]);
  
  return (
    <div className="min-h-screen border-x border-borderGray">
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
          <h1 className="text-xl font-bold">Search</h1>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[15px] text-gray-500">
          <span className="text-white font-medium">Search results for: </span>
          <span>{query}</span>
        </div>
      </div>
      
      {/* Results */}
      <div className="divide-y divide-borderGray">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : !hasResults ? (
          <div className="py-8 px-4 text-center">
            <div className="mb-4">
              <Image path="/general/no-results.svg" alt="No results" w={120} h={120} className="mx-auto opacity-50" />
            </div>
            <h2 className="text-lg font-bold mb-1">No results found</h2>
            <p className="text-gray-500 text-sm mb-4">
              Try searching for something else or check your spelling.
            </p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id}>
              <Post post={post} currentUser={user} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
