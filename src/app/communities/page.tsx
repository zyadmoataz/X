'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Image from '@/components/Image';
import Link from 'next/link';

type Community = {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  avatar_url: string;
  member_count: number;
  is_member: boolean;
};

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const { user } = useAuth();

  useEffect(() => {
    const fetchCommunities = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      // Fetch communities from Supabase
      const { data: allCommunities, error: allError } = await supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false });
      
      if (allError) {
        console.error('Error fetching communities:', allError);
      }
      
      // Fetch user's memberships
      const { data: memberships, error: memberError } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);
      
      if (memberError) {
        console.error('Error fetching memberships:', memberError);
      }
      
      // Create a set of community IDs the user is a member of
      const membershipSet = new Set((memberships || []).map(m => m.community_id));
      
      // Filter and set communities
      if (allCommunities) {
        const communities = allCommunities.map(community => ({
          ...community,
          is_member: membershipSet.has(community.id)
        }));
        
        setCommunities(communities.filter(c => !c.is_member));
        setMyCommunities(communities.filter(c => c.is_member));
      }
      
      setIsLoading(false);
    };
    
    fetchCommunities();
  }, [user]);

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) return;
    
    // Add user to community
    const { error } = await supabase
      .from('community_members')
      .insert({ community_id: communityId, user_id: user.id });
    
    if (error) {
      console.error('Error joining community:', error);
      return;
    }
    
    // Update community lists
    const communityToMove = communities.find(c => c.id === communityId);
    if (communityToMove) {
      const updatedCommunity = { ...communityToMove, is_member: true };
      setCommunities(communities.filter(c => c.id !== communityId));
      setMyCommunities([...myCommunities, updatedCommunity]);
    }
  };

  const handleLeaveCommunity = async (communityId: string) => {
    if (!user) return;
    
    // Remove user from community
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error leaving community:', error);
      return;
    }
    
    // Update community lists
    const communityToMove = myCommunities.find(c => c.id === communityId);
    if (communityToMove) {
      const updatedCommunity = { ...communityToMove, is_member: false };
      setMyCommunities(myCommunities.filter(c => c.id !== communityId));
      setCommunities([...communities, updatedCommunity]);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-black bg-opacity-80 backdrop-blur-md">
        <div className="px-4 py-3 border-b border-borderGray">
          <h1 className="text-xl font-bold">Communities</h1>
        </div>
        <div className="border-b border-borderGray">
          <div className="flex">
            <button 
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === 'discover' 
                  ? 'text-white border-b-2 border-blue-500' 
                  : 'text-gray-500 hover:bg-gray-900'
              }`}
              onClick={() => setActiveTab('discover')}
            >
              Discover
            </button>
            <button 
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === 'my' 
                  ? 'text-white border-b-2 border-blue-500' 
                  : 'text-gray-500 hover:bg-gray-900'
              }`}
              onClick={() => setActiveTab('my')}
            >
              My Communities
            </button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : activeTab === 'discover' ? (
        <div>
          {communities.length > 0 ? (
            <div className="divide-y divide-borderGray">
              {communities.map((community) => (
                <div key={community.id} className="p-4">
                  <div className="relative h-32 rounded-xl overflow-hidden mb-4">
                    <Image 
                      path={community.cover_url || '/general/community-cover.png'} 
                      alt={community.name} 
                      w={800} 
                      h={200} 
                      className="object-cover w-full h-full" 
                    />
                    <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 rounded-full p-1">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-black">
                        <Image 
                          path={community.avatar_url || '/general/community-logo.png'} 
                          alt={community.name} 
                          w={64} 
                          h={64} 
                          className="object-cover" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/communities/${community.id}`} className="font-bold text-lg hover:underline">
                        {community.name}
                      </Link>
                      <p className="text-gray-500">{community.member_count} members</p>
                      <p className="mt-2 text-gray-300 line-clamp-2">{community.description}</p>
                    </div>
                    <button 
                      onClick={() => handleJoinCommunity(community.id)}
                      className="px-4 py-1.5 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <h2 className="text-xl font-bold mb-2">No communities to discover</h2>
              <p className="text-gray-500">
                You've joined all available communities. Check back later for new ones!
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          {myCommunities.length > 0 ? (
            <div className="divide-y divide-borderGray">
              {myCommunities.map((community) => (
                <div key={community.id} className="p-4">
                  <div className="relative h-32 rounded-xl overflow-hidden mb-4">
                    <Image 
                      path={community.cover_url || '/general/community-cover.png'} 
                      alt={community.name} 
                      w={800} 
                      h={200} 
                      className="object-cover w-full h-full" 
                    />
                    <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 rounded-full p-1">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-black">
                        <Image 
                          path={community.avatar_url || '/general/community-logo.png'} 
                          alt={community.name} 
                          w={64} 
                          h={64} 
                          className="object-cover" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/communities/${community.id}`} className="font-bold text-lg hover:underline">
                        {community.name}
                      </Link>
                      <p className="text-gray-500">{community.member_count} members</p>
                      <p className="mt-2 text-gray-300 line-clamp-2">{community.description}</p>
                    </div>
                    <button 
                      onClick={() => handleLeaveCommunity(community.id)}
                      className="px-4 py-1.5 bg-transparent border border-white text-white rounded-full font-bold hover:bg-white/10 transition-colors"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">You haven't joined any communities yet</h2>
              <p className="text-gray-500 mb-4">
                Communities are a great way to connect with people who share your interests.
              </p>
              <button 
                onClick={() => setActiveTab('discover')}
                className="px-5 py-2 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition-colors"
              >
                Discover communities
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
