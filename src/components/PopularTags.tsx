'use client';

import Link from "next/link";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { mockData } from '@/lib/mockData';

interface TrendingTopic {
  id: string;
  tag: string;
  posts_count: number;
  category: string;
  image_url?: string;
}

const PopularTags = () => {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingTopics();
  }, []);

  const fetchTrendingTopics = async () => {
    setLoading(true);
    try {
      // First try to fetch from Supabase
      const { data, error } = await supabase
        .from('trending_topics')
        .select('*')
        .order('posts_count', { ascending: false })
        .limit(5);

      if (error || !data || data.length === 0) {
        // If there's an error or no data, use mock data
        setTrendingTopics(mockData.trendingTopics);
      } else {
        setTrendingTopics(data);
      }
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      // Fall back to mock data on error
      setTrendingTopics(mockData.trendingTopics);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-sidebar rounded-2xl py-4 px-4 mb-4">
      <h2 className="text-xl font-bold mb-4">Trending Topics</h2>
      
      {loading ? (
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="py-3 flex justify-between items-center">
              <div className="bg-gray-300 h-6 w-32 rounded"></div>
              <div className="bg-gray-300 h-4 w-16 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {trendingTopics.map((topic) => (
            <Link
              href={`/search?q=${encodeURIComponent(topic.tag)}`}
              key={topic.id || topic.tag}
              className="flex items-center justify-between py-2 px-2 hover:bg-gray-800 rounded-lg transition duration-200"
            >
              <div>
                <p className="font-medium">{topic.tag}</p>
                <p className="text-sm text-textGray">{topic.category}</p>
              </div>
              <div className="text-sm text-textGray">
                {topic.posts_count.toLocaleString()} posts
              </div>
            </Link>
          ))}
        </div>
      )}
      
      <Link
        href="/explore/topics"
        className="text-primary text-sm block mt-4 hover:underline"
      >
        Show more
      </Link>
    </div>
  );
};

export default PopularTags;