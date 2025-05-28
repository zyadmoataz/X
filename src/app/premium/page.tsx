'use client';

import { useState } from 'react';
import Image from '@/components/Image';
import { useAuth } from '@/context/AuthContext';

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const { user } = useAuth();

  const plans = {
    yearly: {
      price: '$8',
      period: 'month',
      billingText: 'Billed annually',
      savings: 'Save 12%',
      feature: 'All Premium features',
    },
    monthly: {
      price: '$9',
      period: 'month',
      billingText: 'Billed monthly',
      savings: '',
      feature: 'All Premium features',
    },
  };

  const selectedPlanData = plans[selectedPlan as keyof typeof plans];

  const features = [
    {
      title: 'Verified badge',
      description: 'Let people know your account is authentic',
      icon: '/icons/verified.svg',
    },
    {
      title: 'Prioritized rankings',
      description: 'Your posts will get better visibility in conversations and search',
      icon: '/icons/trending.svg',
    },
    {
      title: 'Longer posts',
      description: 'Create posts up to 4,000 characters long',
      icon: '/icons/post.svg',
    },
    {
      title: 'Edit posts',
      description: 'Edit your posts up to 5 times within 30 minutes',
      icon: '/icons/edit.svg',
    },
    {
      title: 'Ad-free experience',
      description: 'Experience X without ads in the For You and Following timelines',
      icon: '/icons/ad-free.svg',
    },
    {
      title: 'Media uploads',
      description: 'Upload videos up to 60 minutes long and 8GB in size',
      icon: '/icons/media.svg',
    },
  ];

  return (
    <div className="min-h-screen pb-16">
      <div className="sticky top-0 z-10 bg-black bg-opacity-80 backdrop-blur-md">
        <div className="px-4 py-3 border-b border-borderGray">
          <h1 className="text-xl font-bold">Premium</h1>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2">X Premium</h2>
          <p className="text-gray-400">The ultimate way to experience X</p>
        </div>
        
        {/* Plan Selector */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-black rounded-full p-1">
              <button 
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedPlan === 'yearly' ? 'bg-blue-500 text-white' : 'text-gray-400'
                }`}
                onClick={() => setSelectedPlan('yearly')}
              >
                Yearly
              </button>
              <button 
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedPlan === 'monthly' ? 'bg-blue-500 text-white' : 'text-gray-400'
                }`}
                onClick={() => setSelectedPlan('monthly')}
              >
                Monthly
              </button>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center">
              <span className="text-4xl font-bold">{selectedPlanData.price}</span>
              <span className="text-gray-400 ml-1">/{selectedPlanData.period}</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">{selectedPlanData.billingText}</div>
            {selectedPlanData.savings && (
              <div className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-2">
                {selectedPlanData.savings}
              </div>
            )}
          </div>
          
          <ul className="space-y-4 mb-6">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <span className="text-white font-medium">{feature.title}</span>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
          
          <button className="w-full bg-white text-black font-bold py-3 rounded-full hover:bg-gray-200 transition-colors">
            Subscribe Now
          </button>
        </div>
        
        {/* Testimonials */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">What premium users are saying</h3>
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-start mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                  <Image path="/general/user1.png" alt="User" w={40} h={40} className="object-cover" />
                </div>
                <div>
                  <div className="flex items-center">
                    <p className="font-bold">Sarah Johnson</p>
                    <svg viewBox="0 0 24 24" aria-label="Verified account" className="text-blue-500 h-5 w-5 ml-1">
                      <path fill="currentColor" d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"></path>
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">@sarahjohnson</p>
                </div>
              </div>
              <p className="text-gray-200">
                Premium has completely changed how I use X. The ability to edit posts has saved me so many times!
              </p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-start mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                  <Image path="/general/user2.png" alt="User" w={40} h={40} className="object-cover" />
                </div>
                <div>
                  <div className="flex items-center">
                    <p className="font-bold">Alex Chen</p>
                    <svg viewBox="0 0 24 24" aria-label="Verified account" className="text-blue-500 h-5 w-5 ml-1">
                      <path fill="currentColor" d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"></path>
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">@alexchen</p>
                </div>
              </div>
              <p className="text-gray-200">
                The ad-free experience alone is worth it. Plus, the longer post limit has helped me express my thoughts better.
              </p>
            </div>
          </div>
        </div>
        
        {/* FAQ */}
        <div>
          <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-xl p-4">
              <h4 className="font-bold mb-2">How does the verification badge work?</h4>
              <p className="text-gray-300">
                Once you subscribe to Premium, your account will be reviewed and receive a blue verification badge if it meets our requirements for authenticity.
              </p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-4">
              <h4 className="font-bold mb-2">Can I cancel my subscription anytime?</h4>
              <p className="text-gray-300">
                Yes, you can cancel your subscription at any time. Your Premium benefits will continue until the end of your billing period.
              </p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-4">
              <h4 className="font-bold mb-2">What payment methods are accepted?</h4>
              <p className="text-gray-300">
                We accept major credit cards, debit cards, and PayPal for Premium subscriptions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
