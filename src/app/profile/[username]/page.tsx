'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Image from '@/components/Image';
import Post from '@/components/Post';
import Link from 'next/link';

interface ProfileData {
  id: string;
  username: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  followers_count?: number;
  following_count?: number;
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select(`
          *,
          followers_count,
          following_count
        `)
        .eq('username', username)
        .single();

      if (profileError) {
        throw profileError;
      }

      setProfile(profileData);
      setFollowersCount(profileData.followers_count || 0);
      setFollowingCount(profileData.following_count || 0);

      // Check if current user is following this profile
      if (user) {
        const { data: followData, error: followError } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .maybeSingle();
        
        if (followError) {
          throw followError;
        }

        setIsFollowing(!!followData);
      }

      // Fetch posts by this user
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey(id, username, name, avatar_url)
        `)
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      if (postsError) {
        throw postsError;
      }

      setPosts(postsData || []);

    } catch (error) {
      console.error('Error in profile fetch:', error);
      setError('Failed to fetch profile data');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username, user]);

  const handleFollow = async () => {
    if (!user || !profile) return;
    
    if (isFollowing) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);
      
      if (error) {
        console.error('Error unfollowing:', error);
        return;
      }
      
      setIsFollowing(false);
      setFollowersCount(prev => prev - 1);
    } else {
      // Follow
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: profile.id
        });
      
      if (error) {
        console.error('Error following:', error);
        return;
      }
      
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
      
      // Create notification for the user being followed
      await supabase
        .from('notifications')
        .insert({
          user_id: profile.id,
          actor_id: user.id,
          type: 'follow'
        });
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `Joined ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">User not found</h1>
        <p className="text-gray-500">The user @{username} doesn't exist</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black bg-opacity-80 backdrop-blur-md">
        <div className="px-4 py-3 flex items-center gap-6">
          <Link href="/" className="text-xl">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <g>
                <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path>
              </g>
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <p className="text-sm text-gray-500">{formatCount(posts.length)} posts</p>
          </div>
        </div>
      </div>
      
      {/* Profile Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-40 bg-gray-800">
          {profile.cover_url && (
            <Image 
              path={profile.cover_url} 
              alt="Cover" 
              w={800} 
              h={200} 
              className="w-full h-full object-cover" 
            />
          )}
        </div>
        
        {/* Profile Image */}
        <div className="absolute left-4 -bottom-16">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-black">
            <Image 
              path={profile.avatar_url || "/general/avatar.png"} 
              alt={profile.name} 
              w={128} 
              h={128} 
              className="object-cover" 
            />
          </div>
        </div>
        
        {/* Follow Button */}
        <div className="absolute right-4 bottom-4">
          {user && user.id !== profile.id && (
            <button 
              onClick={handleFollow}
              className={`px-4 py-1.5 rounded-full font-bold ${
                isFollowing 
                  ? 'bg-transparent text-white border border-white hover:bg-white/10' 
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          {user && user.id === profile.id && (
            <Link 
              href="/settings/profile" 
              className="px-4 py-1.5 rounded-full font-bold border border-white text-white hover:bg-white/10"
            >
              Edit profile
            </Link>
          )}
        </div>
      </div>
      
      {/* Profile Info */}
      <div className="mt-20 px-4">
        <h2 className="text-xl font-bold">{profile.name}</h2>
        <p className="text-gray-500 mb-3">@{profile.username}</p>
        
        {profile.bio && (
          <p className="mb-3">{profile.bio}</p>
        )}
        
        <div className="flex items-center gap-4 text-gray-500 mb-4 text-sm">
          {profile.location && (
            <div className="flex items-center">
              <svg viewBox="0 0 24 24" className="h-4 w-4 mr-1 fill-current">
                <g>
                  <path d="M12 14.315c-2.088 0-3.787-1.698-3.787-3.786S9.913 6.74 12 6.74s3.787 1.7 3.787 3.787-1.7 3.785-3.787 3.785zm0-6.073c-1.26 0-2.287 1.026-2.287 2.287S10.74 12.814 12 12.814s2.287-1.025 2.287-2.286S13.26 8.24 12 8.24z"></path>
                  <path d="M20.692 10.69C20.692 5.9 16.792 2 12 2s-8.692 3.9-8.692 8.69c0 1.902.603 3.708 1.743 5.223l.003-.002.007.015c1.628 2.07 6.278 5.757 6.475 5.912.138.11.302.163.465.163.165 0 .33-.053.467-.162.197-.155 4.847-3.84 6.475-5.912l.007-.014.002.002c1.14-1.516 1.743-3.32 1.743-5.223"></path>
                </g>
              </svg>
              {profile.location}
            </div>
          )}
          
          <div className="flex items-center">
            <svg viewBox="0 0 24 24" className="h-4 w-4 mr-1 fill-current">
              <g>
                <path d="M7 4V3h2v1h6V3h2v1h1.5C19.89 4 21 5.12 21 6.5v12c0 1.38-1.11 2.5-2.5 2.5h-13C4.12 21 3 19.88 3 18.5v-12C3 5.12 4.12 4 5.5 4H7zm0 2H5.5c-.27 0-.5.22-.5.5v12c0 .28.23.5.5.5h13c.28 0 .5-.22.5-.5v-12c0-.28-.22-.5-.5-.5H17v1h-2V6H9v1H7V6zm0 6h2v-2H7v2zm0 4h2v-2H7v2zm4-4h2v-2h-2v2zm0 4h2v-2h-2v2zm4-4h2v-2h-2v2z"></path>
              </g>
            </svg>
            {formatDate(profile.created_at)}
          </div>
        </div>
        
        {/* Followers/Following */}
        <div className="flex gap-5 mb-4">
          <Link href={`/profile/${profile.username}/following`} className="hover:underline">
            <span className="font-bold">{formatCount(followingCount)}</span>
            <span className="text-gray-500 ml-1">Following</span>
          </Link>
          <Link href={`/profile/${profile.username}/followers`} className="hover:underline">
            <span className="font-bold">{formatCount(followersCount)}</span>
            <span className="text-gray-500 ml-1">Followers</span>
          </Link>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-borderGray">
        <div className="flex text-center">
          <button 
            className={`flex-1 py-3 font-medium ${
              activeTab === 'posts' 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-gray-500 hover:bg-gray-900'
            }`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button 
            className={`flex-1 py-3 font-medium ${
              activeTab === 'replies' 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-gray-500 hover:bg-gray-900'
            }`}
            onClick={() => setActiveTab('replies')}
          >
            Replies
          </button>
          <button 
            className={`flex-1 py-3 font-medium ${
              activeTab === 'media' 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-gray-500 hover:bg-gray-900'
            }`}
            onClick={() => setActiveTab('media')}
          >
            Media
          </button>
          <button 
            className={`flex-1 py-3 font-medium ${
              activeTab === 'likes' 
                ? 'text-white border-b-2 border-blue-500' 
                : 'text-gray-500 hover:bg-gray-900'
            }`}
            onClick={() => setActiveTab('likes')}
          >
            Likes
          </button>
        </div>
      </div>
      
      {/* Content based on active tab */}
      {activeTab === 'posts' && (
        <div>
          {posts.length > 0 ? (
            <div className="divide-y divide-borderGray">
              {posts.map(post => (
                <Post 
                  key={post.id}
                  post={post}
                  currentUser={user}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <h2 className="text-2xl font-bold mb-2">No posts yet</h2>
              <p className="text-gray-500">
                When @{profile.username} posts, you'll see their posts here.
              </p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'replies' && (
        <div className="py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Replies coming soon</h2>
          <p className="text-gray-500">
            This feature is under development.
          </p>
        </div>
      )}
      
      {activeTab === 'media' && (
        <div className="py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Media coming soon</h2>
          <p className="text-gray-500">
            This feature is under development.
          </p>
        </div>
      )}
      
      {activeTab === 'likes' && (
        <div className="py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Likes coming soon</h2>
          <p className="text-gray-500">
            This feature is under development.
          </p>
        </div>
      )}
    </div>
  );
}
