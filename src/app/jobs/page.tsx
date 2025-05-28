'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from '@/components/Image';
import Link from 'next/link';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  logo_url: string;
  url: string;
  created_at: string;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [featuredJob, setFeaturedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      
      // Fetch jobs from Supabase
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching jobs:', error);
      } else if (data) {
        // Set the first job as featured
        if (data.length > 0) {
          setFeaturedJob(data[0]);
          setJobs(data.slice(1));
        } else {
          setJobs([]);
        }
      }
      
      setIsLoading(false);
    };
    
    fetchJobs();
  }, []);

  const filteredJobs = filter === 'All' 
    ? jobs 
    : jobs.filter(job => job.type === filter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-black bg-opacity-80 backdrop-blur-md">
        <div className="px-4 py-3 border-b border-borderGray">
          <h1 className="text-xl font-bold">Jobs</h1>
        </div>
        <div className="px-4 py-2 border-b border-borderGray overflow-x-auto">
          <div className="flex space-x-2">
            {['All', 'Full-time', 'Part-time', 'Contract', 'Remote'].map((type) => (
              <button
                key={type}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                  filter === type 
                    ? 'bg-white text-black' 
                    : 'bg-transparent text-gray-400 border border-gray-700 hover:border-gray-500'
                }`}
                onClick={() => setFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div>
          {/* Featured Job */}
          {featuredJob && (
            <div className="p-4 border-b border-borderGray">
              <div className="bg-blue-900/20 p-4 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <Image 
                      path={featuredJob.logo_url || '/general/company-logo.png'} 
                      alt={featuredJob.company}
                      w={64}
                      h={64}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-lg">{featuredJob.title}</h2>
                      <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs">Featured</span>
                    </div>
                    <p className="text-gray-400">{featuredJob.company} • {featuredJob.location}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-xs">
                        {featuredJob.type}
                      </span>
                      {featuredJob.salary && (
                        <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-xs">
                          {featuredJob.salary}
                        </span>
                      )}
                      <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-xs">
                        {formatDate(featuredJob.created_at)}
                      </span>
                    </div>
                    <p className="mt-3 text-gray-300 line-clamp-2">{featuredJob.description}</p>
                    <a 
                      href={featuredJob.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-3 inline-block bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-600 transition"
                    >
                      Apply Now
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Job List */}
          {filteredJobs.length > 0 ? (
            <div className="divide-y divide-borderGray">
              {filteredJobs.map((job) => (
                <div key={job.id} className="p-4 hover:bg-gray-900/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <Image 
                        path={job.logo_url || '/general/company-logo.png'} 
                        alt={job.company}
                        w={48}
                        h={48}
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{job.title}</h3>
                      <p className="text-gray-400">{job.company} • {job.location}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-xs">
                          {job.type}
                        </span>
                        {job.salary && (
                          <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-xs">
                            {job.salary}
                          </span>
                        )}
                        <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-xs">
                          {formatDate(job.created_at)}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-300 line-clamp-2">{job.description}</p>
                      <a 
                        href={job.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-blue-500 hover:underline text-sm"
                      >
                        View details
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">No jobs found</h2>
              <p className="text-gray-500">
                {filter === 'All' 
                  ? 'No jobs are currently available.' 
                  : `No ${filter} jobs are currently available.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
