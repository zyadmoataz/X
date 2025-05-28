'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Post from '@/components/Post';
import Link from 'next/link';
import Image from '@/components/Image';

type SavedPost = {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
  post: any;
  collection_id?: string;
};

type Collection = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  post_count: number;
};

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<SavedPost[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBookmarksData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch bookmarked posts from Supabase
        const { data, error } = await supabase
          .from('bookmarks')
          .select(`
            *,
            post:post_id(
              id,
              content,
              created_at,
              media_urls,
              likes_count,
              comments_count,
              reposts_count,
              user:user_id(id, username, name, avatar_url)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          // If an error occurs, create some mock bookmarks for demo purposes
          console.error('Error fetching bookmarks:', error);
          
          // Create mock data
          const mockBookmarks: SavedPost[] = [
            {
              id: '1',
              user_id: user.id,
              post_id: 'post1',
              created_at: new Date().toISOString(),
              post: {
                id: 'post1',
                content: 'This is a great post about web development that I saved for later reference!',
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                likes_count: 45,
                comments_count: 12,
                reposts_count: 8,
                user: {
                  id: 'user1',
                  username: 'developer',
                  name: 'Web Developer',
                  avatar_url: '/general/avatar.png'
                }
              }
            },
            {
              id: '2',
              user_id: user.id,
              post_id: 'post2',
              created_at: new Date().toISOString(),
              post: {
                id: 'post2',
                content: 'Understanding React hooks is essential for modern web development. Here are my top 5 tips for using useEffect properly...',
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                likes_count: 127,
                comments_count: 23,
                reposts_count: 42,
                user: {
                  id: 'user2',
                  username: 'reactmaster',
                  name: 'React Expert',
                  avatar_url: '/general/avatar.png'
                }
              }
            },
            {
              id: '3',
              user_id: user.id,
              post_id: 'post3',
              created_at: new Date().toISOString(),
              post: {
                id: 'post3',
                content: 'Just launched our new product! Check it out at example.com - would love your feedback!',
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                likes_count: 89,
                comments_count: 34,
                reposts_count: 15,
                user: {
                  id: 'user3',
                  username: 'techfounder',
                  name: 'Tech Founder',
                  avatar_url: '/general/avatar.png'
                }
              }
            }
          ];
          
          setBookmarks(mockBookmarks);
        } else {
          setBookmarks(data || []);
        }
        
        // Fetch bookmark collections
        try {
          const { data: collectionData, error: collectionError } = await supabase
            .from('bookmark_collections')
            .select('*')
            .eq('user_id', user.id);
            
          if (collectionError) {
            console.error('Error fetching collections:', collectionError);
            
            // Create mock collections
            const mockCollections: Collection[] = [
              {
                id: 'col1',
                user_id: user.id,
                name: 'Development Resources',
                created_at: new Date().toISOString(),
                post_count: 2
              },
              {
                id: 'col2',
                user_id: user.id,
                name: 'Inspiration',
                created_at: new Date().toISOString(),
                post_count: 1
              }
            ];
            
            setCollections(mockCollections);
          } else {
            setCollections(collectionData || []);
          }
        } catch (collectionsError) {
          console.error('Error in collections fetch:', collectionsError);
        }
      } catch (err) {
        console.error('Error in fetchBookmarksData:', err);
        setError('Failed to load bookmarks. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookmarksData();
  }, [user]);

  const handleRemoveBookmark = async (postId: string) => {
    if (!user) return;
    
    try {
      // Delete bookmark from Supabase
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);
      
      if (error) {
        console.error('Error removing bookmark:', error);
        setError('Failed to remove bookmark. Please try again.');
      } else {
        // Update state
        setBookmarks(bookmarks.filter(bookmark => bookmark.post_id !== postId));
      }
    } catch (err) {
      console.error('Error in handleRemoveBookmark:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };
  
  const createCollection = async () => {
    if (!user || !newCollectionName.trim()) return;
    
    setIsOrganizing(true);
    
    try {
      const { data, error } = await supabase
        .from('bookmark_collections')
        .insert({
          user_id: user.id,
          name: newCollectionName.trim(),
          created_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error('Error creating collection:', error);
        setError('Failed to create collection. Please try again.');
      } else if (data) {
        // Add new collection to state
        setCollections([...collections, { ...data[0], post_count: 0 }]);
        setNewCollectionName('');
      }
    } catch (err) {
      console.error('Error in createCollection:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsOrganizing(false);
    }
  };
  
  const addToCollection = async (bookmarkId: string, collectionId: string) => {
    if (!user) return;
    
    try {
      // First, find the bookmark
      const bookmark = bookmarks.find(b => b.id === bookmarkId);
      if (!bookmark) return;
      
      // Update the bookmark with the collection ID
      const { error } = await supabase
        .from('bookmarks')
        .update({ collection_id: collectionId })
        .eq('id', bookmarkId);
      
      if (error) {
        console.error('Error adding to collection:', error);
        setError('Failed to add to collection. Please try again.');
      } else {
        // Update state
        setBookmarks(bookmarks.map(b => 
          b.id === bookmarkId ? { ...b, collection_id: collectionId } : b
        ));
        
        // Update collection post count
        setCollections(collections.map(c => 
          c.id === collectionId ? { ...c, post_count: c.post_count + 1 } : c
        ));
      }
    } catch (err) {
      console.error('Error in addToCollection:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };
  
  const filterBookmarksByCollection = (collectionId: string | null) => {
    setActiveCollection(collectionId);
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-black bg-opacity-80 backdrop-blur-md">
        <div className="px-4 py-3 border-b border-borderGray">
          <h1 className="text-xl font-bold">Bookmarks</h1>
          <p className="text-sm text-gray-500">@{user?.username}</p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500 m-4 p-3 rounded-md">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      
      {/* Collections bar */}
      {!isLoading && bookmarks.length > 0 && (
        <div className="border-b border-borderGray p-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button 
              className={`py-1 px-4 rounded-full text-sm font-medium whitespace-nowrap ${activeCollection === null ? 'bg-blue-500 text-white' : 'text-gray-400 border border-gray-700 hover:bg-gray-800'}`}
              onClick={() => filterBookmarksByCollection(null)}
            >
              All Bookmarks
            </button>
            
            {collections.map(collection => (
              <button 
                key={collection.id}
                className={`py-1 px-4 rounded-full text-sm font-medium whitespace-nowrap ${activeCollection === collection.id ? 'bg-blue-500 text-white' : 'text-gray-400 border border-gray-700 hover:bg-gray-800'}`}
                onClick={() => filterBookmarksByCollection(collection.id)}
              >
                {collection.name}
              </button>
            ))}
            
            <button 
              className="py-1 px-4 rounded-full text-sm font-medium whitespace-nowrap text-blue-500 border border-blue-500 hover:bg-blue-900/20"
              onClick={() => setIsOrganizing(!isOrganizing)}
            >
              {isOrganizing ? 'Done' : '+ New Collection'}
            </button>
          </div>
          
          {isOrganizing && (
            <div className="mt-3 flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Collection name" 
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="flex-1 bg-transparent border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
              />
              <button 
                onClick={createCollection}
                disabled={!newCollectionName.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
              >
                Create
              </button>
            </div>
          )}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : bookmarks.length > 0 ? (
        <div>
          {bookmarks
            .filter(bookmark => activeCollection === null || bookmark.collection_id === activeCollection)
            .map(bookmark => (
              <div key={bookmark.id}>
                <Post 
                  post={bookmark.post}
                  currentUser={user}
                  onRemoveBookmark={() => handleRemoveBookmark(bookmark.post_id)}
                  isBookmarked={true}
                />
                {isOrganizing && collections.length > 0 && (
                  <div className="px-4 py-2 bg-gray-900 flex items-center gap-2">
                    <span className="text-sm text-gray-400">Add to collection:</span>
                    <div className="flex gap-2 flex-wrap">
                      {collections.map(collection => (
                        <button 
                          key={collection.id}
                          onClick={() => addToCollection(bookmark.id, collection.id)}
                          className={`py-1 px-2 rounded-full text-xs ${bookmark.collection_id === collection.id ? 'bg-blue-500 text-white' : 'border border-gray-600 text-gray-400 hover:bg-gray-800'}`}
                        >
                          {collection.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center">
          <div className="mb-4">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-12 h-12 text-gray-500 mx-auto">
              <g>
                <path
                  fill="currentColor"
                  d="M17.83 4.6a1.2 1.2 0 00-1.7 0l-6.82 6.82-2.42-2.42a1.2 1.2 0 00-1.7 1.7l3.27 3.27a1.2 1.2 0 001.7 0L17.83 6.3a1.2 1.2 0 000-1.7z"
                ></path>
                <path
                  fill="currentColor"
                  d="M19.07 21.12a2.83 2.83 0 01-2.83-2.83V7.5a.5.5 0 01.5-.5h2.83a2.83 2.83 0 012.83 2.83v8.45a2.83 2.83 0 01-2.83 2.83h-.5zM5.1 21.12a2.83 2.83 0 01-2.83-2.83V9.83A2.83 2.83 0 015.1 7h2.83a.5.5 0 01.5.5v10.8a2.83 2.83 0 01-2.83 2.83h-.5z"
                ></path>
              </g>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Save posts for later</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            Bookmark posts to easily find them again in the future. Only you can see your bookmarks.
          </p>
        </div>
      )}
    </div>
  );
}
