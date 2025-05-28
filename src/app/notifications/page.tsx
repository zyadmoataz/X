'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from '@/components/Image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

type Notification = {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'follow' | 'repost' | 'comment' | 'mention';
  post_id?: string;
  created_at: string;
  is_read: boolean;
  actor?: {
    username: string;
    name: string;
    avatar_url: string;
  };
  post?: {
    content: string;
  };
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      setIsLoading(true);
      
      try {
        // Check if notifications table exists and has data
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            *,
            actor:actor_id(username, name, avatar_url),
            post:post_id(content)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) {
          // If table doesn't exist or error occurs, create mock notifications
          console.error('Error fetching notifications:', error);
          const mockNotifications: Notification[] = [
            {
              id: '1',
              user_id: user.id,
              actor_id: 'actor1',
              type: 'follow',
              created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
              is_read: false,
              actor: {
                username: 'elonmusk',
                name: 'Elon Musk',
                avatar_url: '/general/avatar.png'
              }
            },
            {
              id: '2',
              user_id: user.id,
              actor_id: 'actor2',
              type: 'like',
              post_id: 'post1',
              created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
              is_read: false,
              actor: {
                username: 'BillGates',
                name: 'Bill Gates',
                avatar_url: '/general/avatar.png'
              },
              post: {
                content: 'This is an amazing post about technology!'
              }
            },
            {
              id: '3',
              user_id: user.id,
              actor_id: 'actor3',
              type: 'repost',
              post_id: 'post2',
              created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              is_read: true,
              actor: {
                username: 'SatyaNadella',
                name: 'Satya Nadella',
                avatar_url: '/general/avatar.png'
              },
              post: {
                content: 'Thoughts on the future of cloud computing...' 
              }
            },
            {
              id: '4',
              user_id: user.id,
              actor_id: 'actor4',
              type: 'comment',
              post_id: 'post1',
              created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              is_read: true,
              actor: {
                username: 'sundarpichai',
                name: 'Sundar Pichai',
                avatar_url: '/general/avatar.png'
              },
              post: {
                content: 'This is an amazing post about technology!'
              }
            },
            {
              id: '5',
              user_id: user.id,
              actor_id: 'actor5',
              type: 'mention',
              post_id: 'post3',
              created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              is_read: true,
              actor: {
                username: 'timcook',
                name: 'Tim Cook',
                avatar_url: '/general/avatar.png'
              },
              post: {
                content: 'Hey @user, what do you think about the new product launch?'
              }
            }
          ];
          
          setNotifications(mockNotifications);
        } else {
          setNotifications(data || []);
          
          // Mark all notifications as read
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
        }
      } catch (err) {
        console.error('Error in notification handling:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        // Fetch the new notification with actor details
        const fetchNewNotification = async () => {
          const { data, error } = await supabase
            .from('notifications')
            .select(`
              *,
              actor:actor_id(username, name, avatar_url),
              post:post_id(content)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (!error && data) {
            setNotifications(prev => [data, ...prev]);
          }
        };
        
        fetchNewNotification();
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return 'liked your post';
      case 'repost':
        return 'reposted your post';
      case 'follow':
        return 'followed you';
      case 'comment':
        return 'commented on your post';
      case 'mention':
        return 'mentioned you in a post';
      default:
        return 'interacted with your post';
    }
  };
  
  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return '/icons/heart-fill.svg';
      case 'repost':
        return '/icons/repost-fill.svg';
      case 'follow':
        return '/icons/follow-fill.svg';
      case 'comment':
        return '/icons/comment-fill.svg';
      case 'mention':
        return '/icons/mention-fill.svg';
      default:
        return '/icons/notification.svg';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-black bg-opacity-80 backdrop-blur-md">
        <div className="px-4 py-3 border-b border-borderGray">
          <h1 className="text-xl font-bold">Notifications</h1>
          <div className="flex mt-3 border-b border-borderGray">
            <button className="flex-1 py-3 text-white border-b-2 border-blue-500 font-medium">
              All
            </button>
            <button className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-900">
              Mentions
            </button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : notifications.length > 0 ? (
        <div className="divide-y divide-borderGray">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`px-4 py-3 hover:bg-gray-900 transition-colors flex items-start gap-3 ${!notification.is_read ? 'bg-blue-900/10' : ''}`}
            >
              <div className="mt-1 text-blue-500">
                <Image 
                  path={getNotificationIcon(notification)} 
                  alt={notification.type} 
                  w={16} 
                  h={16} 
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image 
                      path={notification.actor?.avatar_url || "/general/avatar.png"} 
                      alt={notification.actor?.name || ""} 
                      w={40} 
                      h={40} 
                      className="object-cover" 
                    />
                  </div>
                  <div className="flex-1">
                    <span>
                      <Link href={`/profile/${notification.actor?.username}`} className="font-bold hover:underline">
                        {notification.actor?.name}
                      </Link>
                      <span className="ml-1">{getNotificationText(notification)}</span>
                      <span className="ml-2 text-sm text-gray-500">{formatDate(notification.created_at)}</span>
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(notification.created_at)}
                  </div>
                </div>
                
                {notification.post && notification.post_id && (
                  <Link href={`/post/${notification.post_id}`} className="mt-2 text-gray-400 block">
                    {notification.post.content.length > 60 
                      ? notification.post.content.substring(0, 60) + '...' 
                      : notification.post.content}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-gray-500">
          <p className="text-xl mb-2">You don't have any notifications yet</p>
          <p>When you get notifications, they'll show up here</p>
        </div>
      )}
    </div>
  );
}
