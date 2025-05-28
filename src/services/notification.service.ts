import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/supabase';
import { subscribeToChannel } from '@/lib/supabase';

/**
 * Fetch user notifications
 */
export const fetchNotifications = async (userId: string, onlyUnread = false) => {
  let query = supabase
    .from('notifications')
    .select(`
      *,
      actor:actor_id (name, username, avatar_url),
      post:post_id (content),
      comment:comment_id (content)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (onlyUnread) {
    query = query.eq('seen', false);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
  
  return data;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ seen: true })
    .eq('id', notificationId);
  
  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
  
  return { success: true };
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ seen: true })
    .eq('user_id', userId)
    .eq('seen', false);
  
  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
  
  return { success: true };
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('seen', false);
  
  if (error) {
    console.error('Error counting unread notifications:', error);
    throw error;
  }
  
  return count || 0;
};

/**
 * Subscribe to notifications in real-time
 */
export const subscribeToNotifications = (
  userId: string,
  callback: (notification: Notification) => void
) => {
  return subscribeToChannel(
    'notifications',
    'INSERT',
    (payload) => {
      // Only trigger callback if this notification is for the current user
      if (payload.new && payload.new.user_id === userId) {
        callback(payload.new as Notification);
      }
    }
  );
};
