"use client";

import { useEffect, useState } from "react";
import Post from "./Post";
import { fetchFeedPosts } from "@/services/post.service";
import { Post as PostType } from "@/types/supabase";
import { useAuth } from "@/context/AuthContext";
import { subscribeToChannel } from "@/lib/supabase";

const Feed = () => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const postsData = await fetchFeedPosts(20);
        setPosts(postsData);
      } catch (err) {
        console.error('Error loading posts:', err);
        setError('Failed to load posts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();

    // Set up real-time subscription for new posts
    const subscription = subscribeToChannel(
      'posts',
      'INSERT',
      (payload) => {
        // Add new post to the top of the feed
        setPosts(prevPosts => [payload.new as PostType, ...prevPosts]);
      }
    );

    return () => {
      // Clean up subscription when component unmounts
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="py-10 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-iconBlue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-5 text-center text-red-500">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-3 text-iconBlue hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-10 text-center text-textGray">
        <p>No posts found. Follow some users to see their posts!</p>
      </div>
    );
  }

  return (
    <div className=''>
      {posts.map(post => (
        <Post key={post.id} post={post} currentUser={user} />
      ))}
    </div>
  );
}

export default Feed