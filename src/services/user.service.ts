import { supabase } from '@/lib/supabase';
import { User } from '@/types/supabase';

/**
 * Fetch user profile by username
 */
export const fetchUserByUsername = async (username: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
  
  return data;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string, 
  { name, username, bio, avatar_url }: Partial<User>
) => {
  // Basic validation
  if (username && username.includes(' ')) {
    throw new Error('Username cannot contain spaces');
  }

  // If username is being updated, check if it's unique
  if (username) {
    const { data: existingUser, error: usernameError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', userId)
      .single();
    
    if (existingUser) {
      throw new Error('Username is already taken');
    }
  }

  // Update the profile
  const { data, error } = await supabase
    .from('users')
    .update({
      name,
      username,
      bio,
      avatar_url
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
  
  return data;
};

/**
 * Follow a user
 */
export const followUser = async (followerId: string, targetUserId: string) => {
  // Check if already following
  const { data: existingFollow, error: checkError } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', targetUserId);
  
  if (checkError) {
    console.error('Error checking follow status:', checkError);
    throw checkError;
  }
  
  // If already following, do nothing
  if (existingFollow && existingFollow.length > 0) {
    return { alreadyFollowing: true };
  }
  
  // Create the follow relationship
  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: followerId,
      following_id: targetUserId
    });
  
  if (error) {
    console.error('Error following user:', error);
    throw error;
  }
  
  // Update follower count for target user
  const { data: followingUser, error: fetchError } = await supabase
    .from('users')
    .select('followers_count')
    .eq('id', targetUserId)
    .single();
  
  if (fetchError) {
    console.error('Error fetching following user:', fetchError);
    throw fetchError;
  }
  
  const { error: updateFollowingError } = await supabase
    .from('users')
    .update({ 
      followers_count: followingUser.followers_count + 1 
    })
    .eq('id', targetUserId);
  
  if (updateFollowingError) {
    console.error('Error updating followers count:', updateFollowingError);
    throw updateFollowingError;
  }
  
  // Update following count for follower
  const { data: followerUser, error: fetchFollowerError } = await supabase
    .from('users')
    .select('following_count')
    .eq('id', followerId)
    .single();
  
  if (fetchFollowerError) {
    console.error('Error fetching follower:', fetchFollowerError);
    throw fetchFollowerError;
  }
  
  const { error: updateFollowerError } = await supabase
    .from('users')
    .update({ 
      following_count: followerUser.following_count + 1 
    })
    .eq('id', followerId);
  
  if (updateFollowerError) {
    console.error('Error updating following count:', updateFollowerError);
    throw updateFollowerError;
  }
  
  // Create a notification
  await supabase
    .from('notifications')
    .insert({
      user_id: targetUserId,
      actor_id: followerId,
      type: 'follow',
      seen: false
    });
  
  return { success: true };
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (followerId: string, targetUserId: string) => {
  // Check if following
  const { data: existingFollow, error: checkError } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', targetUserId);
  
  if (checkError) {
    console.error('Error checking follow status:', checkError);
    throw checkError;
  }
  
  // If not following, do nothing
  if (!existingFollow || existingFollow.length === 0) {
    return { notFollowing: true };
  }
  
  // Remove the follow relationship
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', targetUserId);
  
  if (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
  
  // Update follower count for target user
  const { data: followingUser, error: fetchError } = await supabase
    .from('users')
    .select('followers_count')
    .eq('id', targetUserId)
    .single();
  
  if (fetchError) {
    console.error('Error fetching following user:', fetchError);
    throw fetchError;
  }
  
  const { error: updateFollowingError } = await supabase
    .from('users')
    .update({ 
      followers_count: Math.max(0, followingUser.followers_count - 1)
    })
    .eq('id', targetUserId);
  
  if (updateFollowingError) {
    console.error('Error updating followers count:', updateFollowingError);
    throw updateFollowingError;
  }
  
  // Update following count for follower
  const { data: followerUser, error: fetchFollowerError } = await supabase
    .from('users')
    .select('following_count')
    .eq('id', followerId)
    .single();
  
  if (fetchFollowerError) {
    console.error('Error fetching follower:', fetchFollowerError);
    throw fetchFollowerError;
  }
  
  const { error: updateFollowerError } = await supabase
    .from('users')
    .update({ 
      following_count: Math.max(0, followerUser.following_count - 1)
    })
    .eq('id', followerId);
  
  if (updateFollowerError) {
    console.error('Error updating following count:', updateFollowerError);
    throw updateFollowerError;
  }
  
  // Delete the notification if it exists
  await supabase
    .from('notifications')
    .delete()
    .eq('user_id', targetUserId)
    .eq('actor_id', followerId)
    .eq('type', 'follow');
  
  return { success: true };
};

/**
 * Get followers of a user
 */
export const getUserFollowers = async (userId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      follower:follower_id (
        id, username, name, avatar_url
      )
    `)
    .eq('following_id', userId);
  
  if (error) {
    console.error('Error fetching followers:', error);
    throw error;
  }
  
  return data.map(item => item.follower);
};

/**
 * Get users that a user is following
 */
export const getUserFollowing = async (userId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      following:following_id (
        id, username, name, avatar_url
      )
    `)
    .eq('follower_id', userId);
  
  if (error) {
    console.error('Error fetching following:', error);
    throw error;
  }
  
  return data.map(item => item.following);
};

/**
 * Check if a user is following another user
 */
export const isFollowing = async (followerId: string, targetUserId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', targetUserId);
  
  if (error) {
    console.error('Error checking follow status:', error);
    throw error;
  }
  
  return data && data.length > 0;
};
