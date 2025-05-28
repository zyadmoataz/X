'use client';

import { useState, useEffect, useRef } from 'react';
import Image from "./Image";
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SearchResult = {
  id: string;
  username: string;
  name: string;
  avatar_url: string;
  type: 'user' | 'hashtag' | 'post';
};

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Add click away listener to close results
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.length > 1) {
        searchUsers();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const searchUsers = async () => {
    try {
      setLoading(true);
      setShowResults(true);
      
      // Search for users
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, username, name, avatar_url')
        .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(3);
      
      if (userError) throw userError;
      
      const userResults = users?.map(user => ({
        ...user,
        type: 'user' as const,
      })) || [];
      
      // Search for hashtags if query starts with #
      let hashtagResults: SearchResult[] = [];
      if (query.startsWith('#')) {
        const { data: hashtags, error: hashtagError } = await supabase
          .from('trending_topics')
          .select('id, tag')
          .ilike('tag', `%${query.substring(1)}%`)
          .limit(2);
        
        if (hashtagError) throw hashtagError;
        
        hashtagResults = hashtags?.map(tag => ({
          id: tag.id,
          username: tag.tag,
          name: `#${tag.tag}`,
          avatar_url: '',
          type: 'hashtag' as const,
        })) || [];
      }
      
      // Set combined results
      setResults([...userResults, ...hashtagResults]);
      
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setShowResults(false);
    }
  };

  return (
    <div className='relative' ref={searchRef}>
      <form onSubmit={handleSearch} className='bg-inputGray py-2 px-4 flex items-center gap-4 rounded-full'>
        <Image path="icons/explore.svg" alt="search" w={16} h={16}/>
        <input 
          type="text" 
          placeholder="Search X" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 1 && setShowResults(true)}
          className="bg-transparent w-full outline-none placeholder:text-textGray"
        />
        {loading && <div className="animate-spin h-4 w-4 border-2 border-iconBlue rounded-full border-t-transparent"></div>}
      </form>
      
      {/* Search results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute mt-2 w-full bg-black border border-borderGray rounded-xl overflow-hidden shadow-lg z-20">
          {results.map((result) => (
            <Link 
              key={`${result.type}-${result.id}`}
              href={result.type === 'user' 
                ? `/profile/${result.username}` 
                : `/search?q=${encodeURIComponent(result.name)}`}
              onClick={() => setShowResults(false)}
              className="flex items-center gap-3 p-3 hover:bg-[#181818] transition-colors"
            >
              {result.type === 'user' ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image 
                    path={result.avatar_url || '/general/avatar.png'} 
                    alt={result.name} 
                    w={40} 
                    h={40} 
                    tr={true}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-inputGray">
                  <span className="text-iconBlue text-lg">#</span>
                </div>
              )}
              <div>
                <div className="font-bold">{result.name}</div>
                {result.type === 'user' && (
                  <div className="text-sm text-textGray">@{result.username}</div>
                )}
              </div>
            </Link>
          ))}
          <div className="p-3 border-t border-borderGray">
            <Link 
              href={`/search?q=${encodeURIComponent(query)}`}
              onClick={() => setShowResults(false)}
              className="text-iconBlue hover:underline"
            >
              Search for "{query}"
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;