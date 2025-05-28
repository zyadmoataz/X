export interface Post {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  media_urls?: string[];
  media_types?: string[];
  location?: string;
  scheduled_for?: string;
  likes_count: number;
  reposts_count: number;
  comments_count: number;
  views_count: number;
  is_repost: boolean;
  users?: {
    id: string;
    username: string;
    name: string;
    avatar_url?: string;
  };
}

export interface User {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  location?: string;
  followers_count: number;
  following_count: number;
  created_at: string;
}

export type Comment = {
  id: string;
  created_at: string;
  user_id: string;
  post_id: string;
  content: string;
  likes_count: number;
};

export type Like = {
  id: string;
  created_at: string;
  user_id: string;
  post_id: string;
  comment_id?: string;
};

export type Follow = {
  id: string;
  created_at: string;
  follower_id: string;
  following_id: string;
};

export type Notification = {
  id: string;
  created_at: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'follow' | 'repost' | 'mention';
  post_id?: string;
  comment_id?: string;
  seen: boolean;
  actor?: {
    id?: string;
    name: string;
    username: string;
    avatar_url: string;
  };
  post?: {
    id: string;
    content: string;
  };
  comment?: {
    id: string;
    content: string;
  };
};
