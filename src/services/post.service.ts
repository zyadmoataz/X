import { supabase } from '@/lib/supabase';
import { Post } from '@/types/supabase';

/**
 * Fetch posts for the feed with user info and like/comment counts
 */
export const fetchFeedPosts = async (limit = 10, page = 0) => {
  const from = page * limit;
  
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      users:user_id (name, username, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  
  if (error) {
    console.error('Error fetching feed posts:', error);
    throw error;
  }
  
  return data;
};

/**
 * Fetch posts by a specific user
 */
export const fetchUserPosts = async (username: string, limit = 10, page = 0) => {
  const from = page * limit;
  
  // First get the user's ID from username
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();
  
  if (userError) {
    console.error('Error fetching user:', userError);
    throw userError;
  }
  
  // Then get the user's posts
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      users:user_id (name, username, avatar_url)
    `)
    .eq('user_id', userData.id)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  
  if (error) {
    console.error('Error fetching user posts:', error);
    throw error;
  }
  
  return data;
};

/**
 * Fetch a single post with user info and comments
 */
export const fetchPost = async (postId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      users:user_id (name, username, avatar_url),
      comments (
        *,
        users:user_id (name, username, avatar_url)
      )
    `)
    .eq('id', postId)
    .single();
  
  if (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
  
  return data;
};

/**
 * Create a new post
 */
export const createPost = async (userId: string, content: string, mediaUrls?: string[], mediaTypes?: string[]) => {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      content,
      media_urls: mediaUrls,
      media_types: mediaTypes,
      likes_count: 0,
      reposts_count: 0,
      comments_count: 0,
      views_count: 0,
      is_repost: false
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating post:', error);
    throw error;
  }
  
  return data;
};

/**
 * Repost another post
 */
export const repostPost = async (userId: string, originalPostId: string) => {
  // First fetch the original post data
  const { data: originalPost, error: fetchError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', originalPostId)
    .single();
  
  if (fetchError) {
    console.error('Error fetching original post:', fetchError);
    throw fetchError;
  }
  
  // Create a repost
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      content: '',
      media_urls: originalPost.media_urls,
      media_types: originalPost.media_types,
      likes_count: 0,
      reposts_count: 0,
      comments_count: 0,
      views_count: 0,
      is_repost: true,
      original_post_id: originalPostId
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating repost:', error);
    throw error;
  }
  
  // Update repost count on the original post
  const { error: updateError } = await supabase
    .from('posts')
    .update({ 
      reposts_count: originalPost.reposts_count + 1 
    })
    .eq('id', originalPostId);
  
  if (updateError) {
    console.error('Error updating repost count:', updateError);
    // We don't throw here to avoid rolling back the repost creation
  }
  
  return data;
};

/**
 * Like a post
 */
export const likePost = async (userId: string, postId: string) => {
  // First check if the user already liked this post
  const { data: existingLike, error: checkError } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId);
  
  if (checkError) {
    console.error('Error checking like status:', checkError);
    throw checkError;
  }
  
  // If the user already liked the post, do nothing
  if (existingLike && existingLike.length > 0) {
    return { alreadyLiked: true };
  }
  
  // Add a new like
  const { error } = await supabase
    .from('likes')
    .insert({
      user_id: userId,
      post_id: postId
    });
  
  if (error) {
    console.error('Error liking post:', error);
    throw error;
  }
  
  // Get the current post data to update the likes count
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('likes_count')
    .eq('id', postId)
    .single();
  
  if (fetchError) {
    console.error('Error fetching post data:', fetchError);
    throw fetchError;
  }
  
  // Update the likes count on the post
  const { error: updateError } = await supabase
    .from('posts')
    .update({ 
      likes_count: post.likes_count + 1 
    })
    .eq('id', postId);
  
  if (updateError) {
    console.error('Error updating like count:', updateError);
    throw updateError;
  }
  
  // Create a notification for the post owner
  const { data: postData } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();
    
  if (postData && postData.user_id !== userId) {
    await supabase
      .from('notifications')
      .insert({
        user_id: postData.user_id,
        actor_id: userId,
        type: 'like',
        post_id: postId,
        seen: false
      });
  }
  
  return { success: true };
};

/**
 * Unlike a post
 */
export const unlikePost = async (userId: string, postId: string) => {
// First check if the post exists
const { data: postData, error: postError } = await supabase
.from('posts')
.select('id, likes_count')
.eq('id', postId)
.single();
  
if (postError) {
console.error('Error fetching post to unlike:', postError);
throw postError;
}

// Check if the user has already liked the post
const { data: existingLike, error: likeCheckError } = await supabase
.from('likes')
.select('id')
.eq('user_id', userId)
.eq('post_id', postId)
.maybeSingle();
  
if (likeCheckError) {
console.error('Error checking existing like:', likeCheckError);
throw likeCheckError;
}

if (!existingLike) {
// User hasn't liked the post, nothing to do
return;
}

// Remove the like record
const { error: unlikeError } = await supabase
.from('likes')
.delete()
.eq('id', existingLike.id);
  
if (unlikeError) {
console.error('Error unliking post:', unlikeError);
throw unlikeError;
}

// Decrement the post's like count
const { error: updateError } = await supabase
.from('posts')
.update({ likes_count: Math.max(0, postData.likes_count - 1) })
.eq('id', postId);
  
if (updateError) {
console.error('Error updating post like count:', updateError);
throw updateError;
}

// Remove the notification for the original like if it exists
const { error: notificationError } = await supabase
.from('notifications')
.delete()
.eq('type', 'like')
.eq('actor_id', userId)
.eq('post_id', postId);
  
if (notificationError) {
console.error('Error removing like notification:', notificationError);
// Don't throw here, just log it - the primary action succeeded
}

return {
success: true,
message: 'Post unliked successfully'
};
};

/**
 * Bookmark a post
 */
export const bookmarkPost = async (userId: string, postId: string) => {
// First check if the post exists
const { data: postData, error: postError } = await supabase
.from('posts')
.select('id')
.eq('id', postId)
.single();
  
if (postError) {
console.error('Error fetching post to bookmark:', postError);
throw postError;
}

// Check if the user has already bookmarked the post
const { data: existingBookmark, error: bookmarkCheckError } = await supabase
.from('bookmarks')
.select('id')
.eq('user_id', userId)
.eq('post_id', postId)
.maybeSingle();
  
if (bookmarkCheckError) {
console.error('Error checking existing bookmark:', bookmarkCheckError);
throw bookmarkCheckError;
}

if (existingBookmark) {
// User already bookmarked the post, nothing to do
return {
success: true,
message: 'Post already bookmarked',
id: existingBookmark.id
};
}

// Create the bookmark record
const { data, error: bookmarkError } = await supabase
.from('bookmarks')
.insert({
user_id: userId,
post_id: postId,
created_at: new Date().toISOString()
})
.select()
.single();
  
if (bookmarkError) {
console.error('Error bookmarking post:', bookmarkError);
throw bookmarkError;
}

return {
success: true,
message: 'Post bookmarked successfully',
id: data.id
};
};

/**
 * Remove a bookmark from a post
 */
export const removeBookmark = async (userId: string, postId: string) => {
// Check if the bookmark exists
const { data: existingBookmark, error: bookmarkCheckError } = await supabase
.from('bookmarks')
.select('id')
.eq('user_id', userId)
.eq('post_id', postId)
.maybeSingle();
  
if (bookmarkCheckError) {
console.error('Error checking existing bookmark:', bookmarkCheckError);
throw bookmarkCheckError;
}

if (!existingBookmark) {
// Bookmark doesn't exist, nothing to do
return {
success: true,
message: 'Bookmark not found'
};
}

// Remove the bookmark record
const { error: removeError } = await supabase
.from('bookmarks')
.delete()
.eq('user_id', userId)
.eq('post_id', postId);
  
if (removeError) {
console.error('Error removing bookmark:', removeError);
throw removeError;
}

return {
success: true,
message: 'Bookmark removed successfully'
};
};

/**
 * Add a comment to a post
 */
export const addComment = async (userId: string, postId: string, content: string) => {
  // Create the comment
  const { data, error } = await supabase
    .from('comments')
    .insert({
      user_id: userId,
      post_id: postId,
      content,
      likes_count: 0
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
  
  // Get the current post data to update the comments count
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('comments_count, user_id')
    .eq('id', postId)
    .single();
  
  if (fetchError) {
    console.error('Error fetching post data:', fetchError);
    throw fetchError;
  }
  
  // Update the comments count on the post
  const { error: updateError } = await supabase
    .from('posts')
    .update({ 
      comments_count: post.comments_count + 1 
    })
    .eq('id', postId);
  
  if (updateError) {
    console.error('Error updating comment count:', updateError);
    throw updateError;
  }
  
  // Create a notification for the post owner if it's not the same user
  if (post.user_id !== userId) {
    await supabase
      .from('notifications')
      .insert({
        user_id: post.user_id,
        actor_id: userId,
        type: 'comment',
        post_id: postId,
        comment_id: data.id,
        seen: false
      });
  }
  
  return data;
};
