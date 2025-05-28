'use client';

import Link from "next/link";
import Image from "./Image";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { mockUsers, MockUser } from '@/lib/mockData';

const Recommendations = () => {
  const [suggestedUsers, setSuggestedUsers] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        setLoading(true);
        
        // Use mock users from our data file
        // In a real app, we would filter out users the current user already follows
        const shuffled = [...mockUsers]
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        
        setSuggestedUsers(shuffled);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
        // Fallback to first 3 mock users if there's an error
        setSuggestedUsers(mockUsers.slice(0, 3));
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestedUsers();
  }, []);

  const handleFollow = async (userId: string) => {
    if (!user) {
      // Redirect to login if not logged in
      window.location.href = '/login';
      return;
    }
    
    try {
      // Add follow relationship
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId,
          created_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      // Update the UI - remove from suggestions
      setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
      
      // Show success message
      alert('You are now following this user!');
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

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
          
          <Link href="/communities" className="text-iconBlue p-2 block hover:bg-[#1d1f23] rounded-lg">
            Show More
          </Link>
        </>
      )}
    </div>
  );
};

export default Recommendations;
