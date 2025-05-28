'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Image from '@/components/Image';
import Link from 'next/link';
import Post from '@/components/Post';

export default function ExplorePage() {
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [trendingUsers, setTrendingUsers] = useState<any[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'trending'|'news'|'for-you'>('trending');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTrendingData = async () => {
      setIsLoading(true);
      
      try {
        // Generate mock trending topics if the table doesn't exist or is empty
        const { data: topicsData, error: topicsError } = await supabase
          .from('trending_topics')
          .select('*')
          .order('posts_count', { ascending: false })
          .limit(10);
          
        if (topicsError || !topicsData || topicsData.length === 0) {
          // Create mock trending topics
          const mockTopics = [
            { id: '1', tag: '#Technology', posts_count: 12489 },
            { id: '2', tag: '#Programming', posts_count: 5263 },
            { id: '3', tag: '#WebDevelopment', posts_count: 3845 },
            { id: '4', tag: '#React', posts_count: 2734 },
            { id: '5', tag: '#JavaScript', posts_count: 1932 },
            { id: '6', tag: '#AI', posts_count: 4521 },
            { id: '7', tag: '#MachineLearning', posts_count: 3256 },
            { id: '8', tag: '#DataScience', posts_count: 2892 },
            { id: '9', tag: '#Python', posts_count: 4127 },
            { id: '10', tag: '#CloudComputing', posts_count: 1843 }
          ];
          setTrendingTopics(mockTopics);
        } else {
          setTrendingTopics(topicsData);
        }
        
        // Fetch trending users from Supabase (users with most followers)
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username, name, avatar_url, bio, followers_count')
          .order('followers_count', { ascending: false })
          .limit(5);
        
        if (usersError) {
          console.error('Error fetching trending users:', usersError);
        } else {
          setTrendingUsers(usersData || []);
        }
        
        // Fetch trending posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            users!posts_user_id_fkey(id, username, name, avatar_url),
            likes(count),
            comments(count),
            reposts(count)
          `)
          .order('likes_count', { ascending: false })
          .limit(10);
          
        if (postsError) {
          console.error('Error fetching trending posts:', postsError);
        } else {
          setTrendingPosts(postsData || []);
        }
        
        // If user is logged in, check which trending users they follow
        if (user) {
          const { data: followingData, error: followingError } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);
            
          if (!followingError && followingData) {
            const followingObj: Record<string, boolean> = {};
            followingData.forEach(item => {
              followingObj[item.following_id] = true;
            });
            setFollowingMap(followingObj);
          }
        }
      } catch (error) {
        console.error('Error in fetchTrendingData:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrendingData();
  }, [user]);
  
  const handleFollowUser = async (userId: string) => {
    if (!user) {
      // Redirect to login if not logged in
      window.location.href = '/login';
      return;
    }
    
    try {
      if (followingMap[userId]) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
          
        if (error) throw error;
        
        // Update state
        setFollowingMap(prev => ({
          ...prev,
          [userId]: false
        }));
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });
          
        if (error) throw error;
        
        // Update state
        setFollowingMap(prev => ({
          ...prev,
          [userId]: true
        }));
        
        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            actor_id: user.id,
            type: 'follow'
          });
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-black bg-opacity-80 backdrop-blur-md">
        <div className="px-4 py-3 border-b border-borderGray">
          <h1 className="text-xl font-bold">Explore</h1>
          
          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-3 relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search X"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#202327] text-white rounded-full py-3 px-12 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="absolute left-4 top-3 text-gray-500">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <g>
                  <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z"></path>
                </g>
              </svg>
            </div>
          </form>
        </div>
        
        {/* Tabs */}
        <div className="flex text-center border-b border-borderGray">
          <button 
            className={`flex-1 py-4 font-medium ${activeTab === 'trending' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-900'}`}
            onClick={() => setActiveTab('trending')}
          >
            Trending
          </button>
          <button 
            className={`flex-1 py-4 font-medium ${activeTab === 'news' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-900'}`}
            onClick={() => setActiveTab('news')}
          >
            News
          </button>
          <button 
            className={`flex-1 py-4 font-medium ${activeTab === 'for-you' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-900'}`}
            onClick={() => setActiveTab('for-you')}
          >
            For you
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div>
          {activeTab === 'trending' && (
            <>
              {/* Trending Topics */}
              <div className="border-b border-borderGray">
                <h2 className="px-4 py-3 text-xl font-bold">Trending Topics</h2>
                {trendingTopics.length > 0 ? (
                  <div className="divide-y divide-borderGray">
                    {trendingTopics.map((topic) => (
                      <div 
                        key={topic.id} 
                        className="px-4 py-3 hover:bg-gray-900 transition-colors cursor-pointer"
                        onClick={() => {
                          setSearchQuery(topic.tag);
                          searchInputRef.current?.focus();
                        }}
                      >
                        <div className="text-sm text-gray-500">Trending</div>
                        <div className="font-bold">{topic.tag}</div>
                        <div className="text-sm text-gray-500">{topic.posts_count.toLocaleString()} posts</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No trending topics available
                  </div>
                )}
              </div>
              
              {/* Trending Users */}
              <div className="border-b border-borderGray">
                <h2 className="px-4 py-3 text-xl font-bold">Who to follow</h2>
                {trendingUsers.length > 0 ? (
                  <div className="divide-y divide-borderGray">
                    {trendingUsers.map((user) => (
                      <div 
                        key={user.id} 
                        className="px-4 py-3 hover:bg-gray-900 transition-colors flex items-center justify-between"
                      >
                        <Link href={`/profile/${user.username}`} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            <Image 
                              path={user.avatar_url || "/general/avatar.png"} 
                              alt={user.name} 
                              w={48} 
                              h={48} 
                              className="object-cover" 
                            />
                          </div>
                          <div>
                            <div className="font-bold">{user.name}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                            {user.followers_count && (
                              <div className="text-xs text-gray-500">
                                <span className="font-bold text-white">{user.followers_count.toLocaleString()}</span> followers
                              </div>
                            )}
                          </div>
                        </Link>
                        {user.id !== user?.id && (
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              handleFollowUser(user.id);
                            }}
                            className={`px-4 py-1.5 rounded-full font-bold ${followingMap[user.id] 
                              ? 'border border-gray-500 bg-transparent text-white hover:border-red-500 hover:text-red-500' 
                              : 'bg-white text-black hover:bg-gray-200'}`}
                          >
                            {followingMap[user.id] ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No users to follow at this time
                  </div>
                )}
              </div>
            </>
          )}
          
          {activeTab === 'for-you' && (
            <div>
              <h2 className="px-4 py-3 text-xl font-bold">Popular Posts</h2>
              {trendingPosts.length > 0 ? (
                <div className="divide-y divide-borderGray">
                  {trendingPosts.map((post) => (
                    <Post key={post.id} post={post} currentUser={user} />
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  No popular posts available
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'news' && (
            <div className="p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h2 className="text-2xl font-bold mb-2">News feature coming soon</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                We're working on bringing you the latest news from trusted sources. Stay tuned for updates!  
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
