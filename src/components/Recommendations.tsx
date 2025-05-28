'use client';

import Link from "next/link";
import Image from "./Image";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { mockData } from '@/lib/mockData';

const Recommendations = () => {
  const [suggestedUsers, setSuggestedUsers] = useState<typeof mockData.users[0][]>([]);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState<{[key: string]: boolean}>({});
  const { user } = useAuth();

  useEffect(() => {
    const checkFollowStatus = async (userIds: string[]) => {
      if (!user || userIds.length === 0) return;
      
      try {
        const { data } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .in('following_id', userIds);
          
        if (data) {
          const newFollowStatus: {[key: string]: boolean} = {};
          data.forEach(item => {
            newFollowStatus[item.following_id] = true;
          });
          setFollowStatus(newFollowStatus);
        }
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };
    
    const fetchSuggestedUsers = async () => {
      try {
        setLoading(true);
        
        if (user) {
          // In a real app, we would filter out users the current user already follows
          // Try to get the user's following list from Supabase
          const { data: followingData, error: followingError } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);
            
          if (!followingError && followingData) {
            const followingIds = followingData.map(follow => follow.following_id);
            
            // Filter out users the current user already follows
            const filteredUsers = mockData.users.filter(
              mockUser => !followingIds.includes(mockUser.id)
            );
            
            // Get random selection of users
            const shuffled = [...filteredUsers]
              .sort(() => 0.5 - Math.random())
              .slice(0, 3);
              
            setSuggestedUsers(shuffled);
            
            // Check follow status for these users
            checkFollowStatus(shuffled.map(user => user.id));
          } else {
            // If there's an error or user isn't logged in, use random mock users
            const shuffled = [...mockData.users]
              .sort(() => 0.5 - Math.random())
              .slice(0, 3);
              
            setSuggestedUsers(shuffled);
            
            // Check follow status for these users if user is logged in
            if (user) {
              checkFollowStatus(shuffled.map(user => user.id));
            }
          }
        } else {
          // If user isn't logged in, just show random users
          const shuffled = [...mockData.users]
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);
            
          setSuggestedUsers(shuffled);
          
          // No need to check follow status if user isn't logged in
        }
      } catch (error) {
        console.error('Error fetching suggested users:', error);
        // Fallback to first 3 mock users if there's an error
        const fallbackUsers = mockData.users.slice(0, 3);
        setSuggestedUsers(fallbackUsers);
        
        // Check follow status if user is logged in
        if (user) {
          checkFollowStatus(fallbackUsers.map(user => user.id));
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestedUsers();
  }, [user]);
  
  const handleFollow = async (userId: string) => {
    if (!user) {
      // Redirect to login if not logged in
      window.location.href = '/login';
      return;
    }
    
    try {
      // Update UI immediately for better user experience
      setFollowStatus(prev => ({ ...prev, [userId]: true }));
      
      // Create follow relationship in Supabase
      const { error: followError } = await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: userId,
        created_at: new Date().toISOString()
      });
      
      if (followError) {
        console.error('Error creating follow relationship:', followError);
        // Revert UI state on error
        setFollowStatus(prev => ({ ...prev, [userId]: false }));
        return;
      }
      
      // Update user counts manually since we might not have RPC functions set up
      try {
        // Increment current user's following count
        const { data: currentUserData } = await supabase
          .from('users')
          .select('following_count')
          .eq('id', user.id)
          .single();
          
        if (currentUserData) {
          await supabase
            .from('users')
            .update({ following_count: (currentUserData.following_count || 0) + 1 })
            .eq('id', user.id);
        }
        
        // Increment followed user's followers count
        const { data: followedUserData } = await supabase
          .from('users')
          .select('followers_count')
          .eq('id', userId)
          .single();
          
        if (followedUserData) {
          await supabase
            .from('users')
            .update({ followers_count: (followedUserData.followers_count || 0) + 1 })
            .eq('id', userId);
        }
      } catch (countError) {
        console.error('Error updating follow counts:', countError);
      }
      
      // Create a notification for the followed user
      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          actor_id: user.id,
          type: 'follow',
          created_at: new Date().toISOString()
        });
      } catch (notificationError) {
        console.error('Error creating follow notification:', notificationError);
      }
      
      // Remove the followed user from suggestions
      setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
      
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-2xl border-[1px] border-borderGray flex flex-col gap-4">
        <h1 className="text-xl font-bold text-textGrayLight">Who to follow</h1>
        
        {loading ? (
          // Loading skeleton
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-2 animate-pulse">
                <div className="bg-gray-700 h-12 w-12 rounded-full"></div>
                <div className="flex-1">
                  <div className="bg-gray-700 h-4 w-24 mb-2 rounded"></div>
                  <div className="bg-gray-700 h-3 w-16 rounded"></div>
                </div>
                <div className="bg-gray-700 h-8 w-20 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {suggestedUsers.length > 0 ? (
              <>
                {suggestedUsers.map(suggUser => (
                  <div key={suggUser.id} className="flex justify-between items-center group">
                    <div className="flex gap-2">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image 
                          path={suggUser.avatar_url || "/general/avatar.png"} 
                          alt={suggUser.name} 
                          w={40} 
                          h={40} 
                          className="object-cover" 
                        />
                      </div>
                      <div className="relative">
                        <Link href={`/profile/${suggUser.username}`}>
                          <h3 className="text-sm font-bold hover:underline">{suggUser.name}</h3>
                        </Link>
                        <p className="text-xs text-textGray">@{suggUser.username}</p>
                        
                        {/* User profile hover card */}
                        <div className="absolute left-0 bottom-full mb-2 w-72 bg-black border border-borderGray rounded-xl shadow-lg z-50 hidden group-hover:block">
                          <div className="p-4">
                            <div className="pb-10 relative">
                              {/* Cover image */}
                              <div className="h-24 w-full bg-blue-900 rounded-t-xl">
                                {suggUser.cover_url && (
                                  <Image 
                                    path={suggUser.cover_url}
                                    alt="cover"
                                    w={300}
                                    h={100}
                                    className="w-full h-full object-cover rounded-t-xl"
                                  />
                                )}
                              </div>
                              
                              {/* Profile picture */}
                              <div className="absolute -bottom-8 left-4 w-16 h-16 rounded-full border-4 border-black overflow-hidden">
                                <Image 
                                  path={suggUser.avatar_url || "/general/avatar.png"}
                                  alt={suggUser.name}
                                  w={64}
                                  h={64}
                                  className="object-cover"
                                />
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <Link href={`/profile/${suggUser.username}`}>
                                <h3 className="font-bold hover:underline">{suggUser.name}</h3>
                              </Link>
                              <p className="text-sm text-textGray">@{suggUser.username}</p>
                              
                              {suggUser.bio && (
                                <p className="text-sm mt-2">{suggUser.bio}</p>
                              )}
                              
                              <div className="flex gap-4 text-sm mt-2">
                                <Link href={`/profile/${suggUser.username}/following`} className="hover:underline">
                                  <span className="font-bold">{suggUser.following_count}</span> Following
                                </Link>
                                <Link href={`/profile/${suggUser.username}/followers`} className="hover:underline">
                                  <span className="font-bold">{suggUser.followers_count}</span> Followers
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleFollow(suggUser.id)}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold ${followStatus[suggUser.id] ? 'bg-transparent border border-white text-white hover:border-red-500 hover:text-red-500' : 'bg-white text-black hover:bg-gray-200'}`}
                    >
                      {followStatus[suggUser.id] ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </>
            ) : (
              <></>
            )}
          </>
        )}
        
        <Link href="/communities" className="text-iconBlue">
          Show More
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl border-[1px] border-borderGray flex flex-col gap-4">
      <h1 className="text-xl font-bold text-textGrayLight">Who to follow</h1>
      
      {suggestedUsers.length > 0 ? (
        <>
          {suggestedUsers.map(suggUser => (
            <div key={suggUser.id} className="flex justify-between items-center group">
              <div className="flex gap-2">
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image 
                    path={suggUser.avatar_url || "/general/avatar.png"} 
                    alt={suggUser.name} 
                    w={40} 
                    h={40} 
                    className="object-cover" 
                  />
                </div>
                <div className="relative">
                  <Link href={`/profile/${suggUser.username}`}>
                    <h3 className="text-sm font-bold hover:underline">{suggUser.name}</h3>
                  </Link>
                  <p className="text-xs text-textGray">@{suggUser.username}</p>
                  
                  {/* User profile hover card */}
                  <div className="absolute left-0 bottom-full mb-2 w-72 bg-black border border-borderGray rounded-xl shadow-lg z-50 hidden group-hover:block">
                    <div className="p-4">
                      <div className="pb-10 relative">
                        {/* Cover image */}
                        <div className="h-24 w-full bg-blue-900 rounded-t-xl">
                          {suggUser.cover_url && (
                            <Image 
                              path={suggUser.cover_url}
                              alt="cover"
                              w={300}
                              h={100}
                              className="w-full h-full object-cover rounded-t-xl"
                            />
                          )}
                        </div>
                        
                        {/* Profile picture */}
                        <div className="absolute -bottom-8 left-4 w-16 h-16 rounded-full border-4 border-black overflow-hidden">
                          <Image 
                            path={suggUser.avatar_url || "/general/avatar.png"}
                            alt={suggUser.name}
                            w={64}
                            h={64}
                            className="object-cover"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <Link href={`/profile/${suggUser.username}`}>
                          <h3 className="font-bold hover:underline">{suggUser.name}</h3>
                        </Link>
                        <p className="text-sm text-textGray">@{suggUser.username}</p>
                        
                        {suggUser.bio && (
                          <p className="text-sm mt-2">{suggUser.bio}</p>
                        )}
                        
                        <div className="flex gap-4 text-sm mt-2">
                          <Link href={`/profile/${suggUser.username}/following`} className="hover:underline">
                            <span className="font-bold">{suggUser.following_count}</span> Following
                          </Link>
                          <Link href={`/profile/${suggUser.username}/followers`} className="hover:underline">
                            <span className="font-bold">{suggUser.followers_count}</span> Followers
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleFollow(suggUser.id)}
                className="bg-white text-black rounded-full px-4 py-1.5 text-xs font-bold hover:bg-gray-200"
              >
                Follow
              </button>
            </div>
          ))}
        </>
      ) : (
        <></>
      )}
      
      <Link href="/communities" className="text-iconBlue">
        Show More
      </Link>
    </div>
  );
};

export default Recommendations;