'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Share from "@/components/Share";
import Post from "@/components/Post";
import LeftBar from "@/components/LeftBar";
import RightBar from "@/components/RightBar";
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Image from '@/components/Image';
import Link from 'next/link';
import { mockData } from '@/lib/mockData';

type FeedTab = 'for-you' | 'following';

const Homepage = () => {
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Fetch initial posts when tab changes or user logs in
  useEffect(() => {
    const fetchInitialPosts = async () => {
      setLoading(true);
      setPosts([]);
      setPage(0);
      setHasMore(true);
      await fetchPosts(0, true);
    };
    
    fetchInitialPosts();
    
    // Setup real-time subscription for new posts
    const postsSubscription = supabase
      .channel('public:posts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'posts' 
      }, payload => {
        // When a new post is created, fetch its details and add to the feed
        fetchNewPost(payload.new.id);
      })
      .subscribe();
      
    // Fetch trending topics and suggested users
    fetchTrendingTopics();
    fetchSuggestedUsers();
    
    return () => {
      supabase.removeChannel(postsSubscription);
    };
  }, [user, activeTab]);
  
  const fetchPosts = async (pageNumber = 0, reset = false) => {
    try {
      if (loading && !reset) return;
      
      setLoading(true);
      
      const limit = 10;
      const from = pageNumber * limit;
      const to = from + limit - 1;
      
      try {
        let query;
        
        if (activeTab === 'for-you') {
          // For "For You" tab, fetch all posts
          query = supabase
            .from('posts')
            .select(`
              id,
              created_at,
              content,
              user_id,
              media_urls,
              media_types,
              likes_count,
              reposts_count,
              comments_count,
              views_count,
              is_repost,
              users(id, username, name, avatar_url)
            `)
            .order('created_at', { ascending: false })
            .range(from, to);
        } else {
          // For "Following" tab, fetch only posts from users the current user follows
          if (!user) {
            // If not logged in, use mock data
            useMockData(reset, limit);
            return;
          }
          
          // Get users the current user follows
          const { data: followingData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);
            
          const followingIds = followingData?.map(f => f.following_id) || [];
          
          // Also include the user's own posts
          followingIds.push(user.id);
          
          if (followingIds.length === 0) {
            // If not following anyone, show empty feed
            setPosts([]);
            setLoading(false);
            return;
          }
          
          query = supabase
            .from('posts')
            .select(`
              id,
              created_at,
              content,
              user_id,
              media_urls,
              media_types,
              likes_count,
              reposts_count,
              comments_count,
              views_count,
              is_repost,
              users(id, username, name, avatar_url)
            `)
            .in('user_id', followingIds)
            .order('created_at', { ascending: false })
            .range(from, to);
        }
        
        // Log the query for debugging
        console.log('Executing Supabase query for tab:', activeTab);
        
        try {
          const { data, error } = await query;
          
          if (error) {
            // Log detailed error information
            console.error('Error fetching posts:', JSON.stringify(error));
            console.error('Error details:', {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            });
            
            // Fall back to mock data
            useMockData(reset, limit);
            return;
          }
          
          // Log success
          console.log('Successfully fetched posts, count:', data?.length || 0);
          
          if (data && data.length === 0 && reset && pageNumber === 0) {
            // If no posts in database, use mock data
            useMockData(reset, limit);
          } else if (data) {
            // We got real posts data
            if (data.length < limit) {
              setHasMore(false);
            }
            
            // Generate unique keys for each post
            const postsWithUniqueKeys = data.map((post: any) => ({
              ...post,
              id: post.id || `post_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`
            }));
            
            if (reset) {
              setPosts(postsWithUniqueKeys);
            } else {
              setPosts(prev => [...prev, ...postsWithUniqueKeys]);
            }
          }
        } catch (queryError) {
          console.error('Exception during query execution:', queryError);
          useMockData(reset, limit);
          return;
        }
      } catch (error) {
        console.error('Error executing query:', error);
        useMockData(reset, limit);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in fetchPosts:', error);
      setLoading(false);
    }
  };
  
  const useMockData = (reset: boolean, limit: number) => {
    // Use mock data for simplicity
    setTimeout(() => {
      const mockPosts = mockData.posts.slice(0, limit);
      
      // Generate unique keys for each post
      const postsWithUniqueKeys = mockPosts.map(post => ({
        ...post,
        id: post.id || `post_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`
      }));
      
      if (reset) {
        setPosts(postsWithUniqueKeys);
      } else {
        setPosts(prev => [...prev, ...postsWithUniqueKeys]);
      }
      
      setHasMore(postsWithUniqueKeys.length >= limit);
      setLoading(false);
    }, 500);
  };
  
  const fetchNewPost = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users(id, username, name, avatar_url)
        `)
        .eq('id', postId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Add the new post to the top of the feed
        setPosts(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error fetching new post:', error);
    }
  };
  
  const fetchTrendingTopics = () => {
    // Mock trending topics
    setTrendingTopics([
      { id: 1, name: '#Technology', post_count: 12489 },
      { id: 2, name: '#Programming', post_count: 8765 },
      { id: 3, name: '#React', post_count: 5432 },
      { id: 4, name: '#NextJS', post_count: 4321 },
      { id: 5, name: '#Supabase', post_count: 3210 }
    ]);
  };
  
  const fetchSuggestedUsers = () => {
    // Mock suggested users
    setSuggestedUsers([
      { id: 'user1', name: 'John Doe', username: 'johndoe', avatar_url: 'general/avatar.png' },
      { id: 'user2', name: 'Jane Smith', username: 'janesmith', avatar_url: 'general/avatar.png' },
      { id: 'user3', name: 'Bob Johnson', username: 'bobjohnson', avatar_url: 'general/avatar.png' }
    ]);
  };
  
  // Intersection Observer for infinite scrolling
  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    
    if (loaderRef.current) loaderRef.current = null;
    
    if (node && hasMore) {
      loaderRef.current = node;
      
      const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prevPage => prevPage + 1);
          fetchPosts(page + 1);
        }
      }, { threshold: 0.5 });
      
      observer.observe(node);
      
      return () => {
        if (node) observer.unobserve(node);
      };
    }
  }, [loading, hasMore, page]);

  return (
    <div className="">
      <div className="border-x border-borderGray min-h-screen max-w-7xl mx-auto">
        <div className='px-4 pt-4 flex justify-center gap-[30px] xsm:gap-[50px] sm:gap-[100px] text-textGray font-bold border-b-[1px] border-borderGray'>
          <button 
            onClick={() => setActiveTab('for-you')}
            className={`pb-3 flex items-center ${activeTab === 'for-you' ? 'border-b-4 border-iconBlue text-white' : ''}`}
          >
            For you
          </button>
          <button 
            onClick={() => setActiveTab('following')}
            className={`pb-3 flex items-center ${activeTab === 'following' ? 'border-b-4 border-iconBlue text-white' : ''}`}
          >
            Following
          </button>
        </div>
        
        {user && <Share />}
        
        {loading && posts.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div>
            {posts.length > 0 ? (
              posts.map((post, index) => {
                // Generate a truly unique key for each post
                const uniqueKey = post.id || `post_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}_${index}`;
                
                return (
                  <div 
                    key={uniqueKey} 
                    ref={index === posts.length - 1 ? lastPostElementRef : undefined}
                  >
                    <Post 
                      post={post} 
                      currentUser={user}
                    />
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500">
                {activeTab === 'following' ? 
                  'Follow some users to see their posts here!' : 
                  'No posts found. Be the first to post something!'}
              </div>
            )}
            
            {loading && posts.length > 0 && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;
