'use client';

import Link from "next/link";
import Image from "./Image";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { mockData } from '@/lib/mockData';

type TrendingTopic = {
  id: string;
  tag: string;
  posts_count: number;
  category?: string;
  image_url?: string;
};

const PopularTags = () => {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        setLoading(true);
        
        // Try to fetch from Supabase first
        const { data, error } = await supabase
          .from('trending_topics')
          .select('*')
          .order('posts_count', { ascending: false })
          .limit(5);

        if (error) throw error;

        if (data && data.length > 0) {
          setTrendingTopics(data);
        } else {
          // Use our mock data if Supabase has no data
          setTrendingTopics(mockData.trendingTopics);
        }
      } catch (error) {
        console.error('Error fetching trending topics:', error);
        // Fallback to mock data
        setTrendingTopics(mockData.trendingTopics);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTopics();
  }, []);

  return (
    <div className="p-4 rounded-2xl border-[1px] border-borderGray mb-4">
      <h1 className="text-xl font-bold text-textGrayLight mb-4">Trends for you</h1>
      
      {loading ? (
        // Loading skeleton
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex flex-col gap-1 animate-pulse">
              <div className="bg-gray-700 h-3 w-24 mb-1 rounded"></div>
              <div className="bg-gray-700 h-5 w-40 mb-1 rounded"></div>
              <div className="bg-gray-700 h-3 w-20 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {trendingTopics.map(topic => (
            <Link 
              href={`/hashtag/${topic.tag.replace('#', '')}`} 
              key={topic.id}
              className="flex gap-3 hover:bg-[#1d1f23] p-2 rounded-lg transition-colors"
            >
              {topic.image_url && (
                <div className="h-14 w-14 rounded-md overflow-hidden">
                  <Image 
                    path={topic.image_url} 
                    alt={topic.tag} 
                    w={56} 
                    h={56} 
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <div>
                <p className="text-xs text-textGray">{topic.category || 'Trending'}</p>
                <h3 className="font-bold">{topic.tag}</h3>
                <p className="text-xs text-textGray">{topic.posts_count.toLocaleString()} posts</p>
              </div>
            </Link>
          ))}
          
          <Link href="/explore/trends" className="text-iconBlue p-2 block hover:bg-[#1d1f23] rounded-lg">
            Show more
          </Link>
        </div>
      )}
    </div>
  );
};

export default PopularTags;
