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
  const { user } = useAuth();

  useEffect(() => {
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
          } else {
            // If there's an error or user isn't logged in, use random mock users
            const shuffled = [...mockData.users]
              .sort(() => 0.5 - Math.random())
              .slice(0, 3);
              
            setSuggestedUsers(shuffled);
          }
        } else {
          // If user isn't logged in, just show random users
          const shuffled = [...mockData.users]
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);
            
          setSuggestedUsers(shuffled);
        }
      } catch (error) {
        console.error('Error fetching suggested users:', error);
        // Fallback to first 3 mock users if there's an error
        setSuggestedUsers(mockData.users.slice(0, 3));
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestedUsers();
  }, [user]);
  
  const handleFollow = async (userId: string) => {
    if (!user) return;
    
    try {
      // Create follow relationship
      const { error: followError } = await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: userId,
        created_at: new Date().toISOString()
      });
      
      if (followError) {
        console.error('Error creating follow relationship:', followError);
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

  return (
    <div className="bg-sidebar rounded-2xl py-4 px-4 mb-4">
      <h2 className="text-xl font-bold mb-4">Who to follow</h2>
      
      {loading ? (
        // Loading skeleton
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 items-center">
              <div className="bg-gray-700 h-10 w-10 rounded-full"></div>
              <div className="flex-1">
                <div className="bg-gray-700 h-4 w-24 mb-2 rounded"></div>
                <div className="bg-gray-700 h-3 w-16 rounded"></div>
              </div>
              <div className="bg-gray-700 h-8 w-20 rounded-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {suggestedUsers.length > 0 ? (
            suggestedUsers.map(suggestedUser => (
              <div key={suggestedUser.id} className="flex justify-between items-center group">
                <div className="flex gap-3 items-center">
                  <Link href={`/profile/${suggestedUser.username}`}>
                    <div className="relative w-10 h-10 rounded-full overflow-hidden">
                      <Image 
                        path={suggestedUser.avatar_url || "/general/avatar.png"} 
                        alt={suggestedUser.name} 
                        w={40} 
                        h={40} 
                        className="object-cover" 
                      />
                    </div>
                  </Link>
                  <div>
                    <Link href={`/profile/${suggestedUser.username}`}>
                      <h3 className="font-semibold text-sm hover:underline">{suggestedUser.name}</h3>
                    </Link>
                    <p className="text-xs text-textGray">@{suggestedUser.username}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleFollow(suggestedUser.id)}
                  className="text-xs font-bold py-1.5 px-4 rounded-full bg-white text-black hover:bg-opacity-90 transition"
                >
                  Follow
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-textGray">No suggestions available</p>
          )}
        </div>
      )}
      
      <Link href="/connect" className="text-primary text-sm block mt-4 hover:underline">
        Show more
      </Link>
    </div>
  );
};

export default Recommendations;
