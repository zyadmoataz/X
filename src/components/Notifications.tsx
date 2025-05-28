'use client';

import { useEffect, useState } from 'react';
import { Notification } from '@/types/supabase';
import { fetchNotifications, markNotificationAsRead, subscribeToNotifications } from '@/services/notification.service';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from './Image';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        const data = await fetchNotifications(user.id);
        setNotifications(data);
      } catch (err) {
        console.error('Error loading notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Set up real-time subscription for new notifications
    const subscription = subscribeToNotifications(user.id, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      // Clean up subscription when component unmounts
      subscription.unsubscribe();
    };
  }, [user]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Update the local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, seen: true } 
            : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-5 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-iconBlue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center text-textGray">
        <p>No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-borderGray">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className={`p-4 ${!notification.seen ? 'bg-[#050505]' : ''} hover:bg-[#080808] transition-colors`}
          onClick={() => !notification.seen && handleMarkAsRead(notification.id)}
        >
          <div className="flex items-start gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <Image 
                path={notification.actor?.avatar_url || "general/avatar.png"} 
                alt="" 
                w={100} 
                h={100} 
                tr={true} 
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <p className="text-white">
                  <span className="font-bold">{notification.actor?.name || 'User'}</span>
                  {notification.type === 'like' && ' liked your post'}
                  {notification.type === 'comment' && ' commented on your post'}
                  {notification.type === 'follow' && ' followed you'}
                  {notification.type === 'repost' && ' reposted your post'}
                  {notification.type === 'mention' && ' mentioned you'}
                </p>
                {!notification.seen && (
                  <span className="w-2 h-2 rounded-full bg-iconBlue"></span>
                )}
              </div>
              
              {notification.post && (
                <Link 
                  href={`/${notification.actor?.username || 'user'}/status/${notification.post_id}`}
                  className="mt-1 text-textGray text-sm line-clamp-2"
                >
                  {notification.post.content}
                </Link>
              )}
              
              <p className="text-textGray text-xs mt-1">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
