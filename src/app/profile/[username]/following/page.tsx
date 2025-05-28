'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Image from '@/components/Image';
import Link from 'next/link';

interface FollowingPageProps {
  params: {
    username: string;
  };
}

export default function FollowingPage({ params }: FollowingPageProps) {
  const { username } = params;
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [following, setFollowing] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchFollowing = async () => {
      setIsLoading(true);
      
      try {
        // First get the user profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single();
        
        if (profileError) throw profileError;
        if (!profileData) throw new Error('User not found');
        
        setProfile(profileData);
        
        // Then get the users they're following
        const { data: followingData, error: followingError } = await supabase
          .from('follows')
          .select(`
            following:following_id(
              id,
              username,
              name,
              avatar_url,
              bio
            )
          `)
          .eq('follower_id', profileData.id);
        
        if (followingError) throw followingError;
        
        // Process the following data to flatten it
        const processedFollowing = followingData.map((item) => item.following);
        setFollowing(processedFollowing);
        
        // If current user is logged in, check which users they're following
        if (currentUser) {
          const { data: currentUserFollowingData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUser.id);
          
          if (currentUserFollowingData) {
            const followingObject: Record<string, boolean> = {};
            currentUserFollowingData.forEach((item) => {
              followingObject[item.following_id] = true;
            });
            setFollowingMap(followingObject);
          }
        }
      } catch (err: any) {
        console.error('Error fetching following:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFollowing();
  }, [username, currentUser]);

  const handleFollow = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      if (followingMap[userId]) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);
        
        setFollowingMap(prev => ({
          ...prev,
          [userId]: false
        }));
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: userId
          });
        
        setFollowingMap(prev => ({
          ...prev,
          [userId]: true
        }));
        
        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            actor_id: currentUser.id,
            type: 'follow'
          });
      }
    } catch (err) {
      console.error('Error updating follow status:', err);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black bg-opacity-80 backdrop-blur-md">
        <div className="px-4 py-3 flex items-center gap-6 border-b border-borderGray">
          <Link href={`/profile/${username}`} className="text-xl">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <g>
                <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"></path>
              </g>
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold">
              {profile ? profile.name : username}
            </h1>
            <p className="text-sm text-gray-500">@{username}</p>
          </div>
        </div>
        
        <div className="flex border-b border-borderGray">
          <Link
            href={`/profile/${username}/followers`}
            className="flex-1 py-4 text-center font-medium text-gray-500 hover:bg-gray-900"
          >
            Followers
          </Link>
          <Link
            href={`/profile/${username}/following`}
            className="flex-1 py-4 text-center font-medium text-white border-b-2 border-blue-500"
          >
            Following
          </Link>
        </div>
      </div>
      
      {/* Content */}
      <div className="divide-y divide-borderGray">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : following.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">
              @{username} isn't following anyone
            </h2>
            <p className="text-gray-500">
              When they follow accounts, they'll be listed here.
            </p>
          </div>
        ) : (
          following.map((followedUser) => (
            <div key={followedUser.id} className="p-4 flex items-start justify-between">
              <Link href={`/profile/${followedUser.username}`} className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    path={followedUser.avatar_url || "/general/avatar.png"}
                    alt={followedUser.name}
                    w={48}
                    h={48}
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold hover:underline">{followedUser.name}</span>
                  </div>
                  <p className="text-gray-500">@{followedUser.username}</p>
                  {followedUser.bio && (
                    <p className="mt-1 text-sm line-clamp-2">{followedUser.bio}</p>
                  )}
                </div>
              </Link>
              {currentUser && currentUser.id !== followedUser.id && (
                <button
                  onClick={() => handleFollow(followedUser.id)}
                  className={`px-4 py-1.5 rounded-full font-bold ${
                    followingMap[followedUser.id]
                      ? 'bg-transparent text-white border border-white hover:bg-white/10 hover:text-red-500 hover:border-red-500'
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {followingMap[followedUser.id] ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
