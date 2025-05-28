'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Image from '@/components/Image';
import Link from 'next/link';

interface FollowersPageProps {
  params: {
    username: string;
  };
}

export default function FollowersPage({ params }: FollowersPageProps) {
  const { username } = params;
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchFollowers = async () => {
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
        
        // Then get their followers
        const { data: followersData, error: followersError } = await supabase
          .from('follows')
          .select(`
            follower:follower_id(
              id,
              username,
              name,
              avatar_url,
              bio
            )
          `)
          .eq('following_id', profileData.id);
        
        if (followersError) throw followersError;
        
        // Process the followers data to flatten it
        const processedFollowers = followersData.map((item) => item.follower);
        setFollowers(processedFollowers);
        
        // If current user is logged in, check which users they're following
        if (currentUser) {
          const { data: followingData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUser.id);
          
          if (followingData) {
            const followingObject: Record<string, boolean> = {};
            followingData.forEach((item) => {
              followingObject[item.following_id] = true;
            });
            setFollowingMap(followingObject);
          }
        }
      } catch (err: any) {
        console.error('Error fetching followers:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFollowers();
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
            className="flex-1 py-4 text-center font-medium text-white border-b-2 border-blue-500"
          >
            Followers
          </Link>
          <Link
            href={`/profile/${username}/following`}
            className="flex-1 py-4 text-center font-medium text-gray-500 hover:bg-gray-900"
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
        ) : followers.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">
              @{username} doesn't have any followers yet
            </h2>
            <p className="text-gray-500">
              When someone follows them, they'll be listed here.
            </p>
          </div>
        ) : (
          followers.map((follower) => (
            <div key={follower.id} className="p-4 flex items-start justify-between">
              <Link href={`/profile/${follower.username}`} className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    path={follower.avatar_url || "/general/avatar.png"}
                    alt={follower.name}
                    w={48}
                    h={48}
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold hover:underline">{follower.name}</span>
                  </div>
                  <p className="text-gray-500">@{follower.username}</p>
                  {follower.bio && (
                    <p className="mt-1 text-sm line-clamp-2">{follower.bio}</p>
                  )}
                </div>
              </Link>
              {currentUser && currentUser.id !== follower.id && (
                <button
                  onClick={() => handleFollow(follower.id)}
                  className={`px-4 py-1.5 rounded-full font-bold ${
                    followingMap[follower.id]
                      ? 'bg-transparent text-white border border-white hover:bg-white/10 hover:text-red-500 hover:border-red-500'
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {followingMap[follower.id] ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
