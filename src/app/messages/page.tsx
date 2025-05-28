'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Image from '@/components/Image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    username: string;
    name: string;
    avatar_url: string;
  };
  receiver?: {
    username: string;
    name: string;
    avatar_url: string;
  };
};

type Conversation = {
  user: {
    id: string;
    username: string;
    name: string;
    avatar_url: string;
  };
  lastMessage: Message;
  unreadCount: number;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:sender_id(id, username, name, avatar_url),
            receiver:receiver_id(id, username, name, avatar_url)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (messageError) {
          console.error('Error fetching messages:', messageError);
          setError('Failed to load conversations. Please try again.');

          const mockConversations: Conversation[] = [
            {
              user: {
                id: 'user1',
                username: 'johndoe',
                name: 'John Doe',
                avatar_url: '/general/avatar.png'
              },
              lastMessage: {
                id: 'msg1',
                sender_id: 'user1',
                receiver_id: user.id,
                content: 'Hey! Did you see the latest features on the app?',
                created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
                is_read: false
              },
              unreadCount: 3
            },
            {
              user: {
                id: 'user2',
                username: 'janesmith',
                name: 'Jane Smith',
                avatar_url: '/general/avatar.png'
              },
              lastMessage: {
                id: 'msg2',
                sender_id: user.id,
                receiver_id: 'user2',
                content: 'Thanks for helping me with that project!',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                is_read: true
              },
              unreadCount: 0
            },
            {
              user: {
                id: 'user3',
                username: 'techteam',
                name: 'Tech Support',
                avatar_url: '/general/avatar.png'
              },
              lastMessage: {
                id: 'msg3',
                sender_id: 'user3',
                receiver_id: user.id,
                content: 'Your request has been processed. Please let us know if you need anything else.',
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                is_read: true
              },
              unreadCount: 0
            }
          ];

          setConversations(mockConversations);
        } else {
          const conversationsMap = new Map<string, Conversation>();

          messageData?.forEach((message: Message) => {
            const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
            const otherUser = message.sender_id === user.id ? message.receiver : message.sender;

            if (!otherUser) return;

            if (!conversationsMap.has(otherUserId)) {
              conversationsMap.set(otherUserId, {
                user: {
                  id: otherUserId,
                  username: otherUser.username,
                  name: otherUser.name,
                  avatar_url: otherUser.avatar_url
                },
                lastMessage: message,
                unreadCount: message.receiver_id === user.id && !message.is_read ? 1 : 0
              });
            } else {
              const existingConvo = conversationsMap.get(otherUserId)!;
              const messageTime = new Date(message.created_at).getTime();
              const existingTime = new Date(existingConvo.lastMessage.created_at).getTime();

              if (messageTime > existingTime) {
                existingConvo.lastMessage = message;
              }

              if (message.receiver_id === user.id && !message.is_read) {
                existingConvo.unreadCount += 1;
              }
            }
          });

          const conversationsArray = Array.from(conversationsMap.values()).sort((a, b) => {
            return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
          });

          setConversations(conversationsArray);
        }
      } catch (err) {
        console.error('Error in fetchConversations:', err);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();

    const subscription = supabase
      .channel('messages-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user?.id},receiver_id=eq.${user?.id}`
      }, (payload) => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    const fetchActiveConversationMessages = async () => {
      if (!user || !activeConversation) return;

      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:sender_id(id, username, name, avatar_url),
            receiver:receiver_id(id, username, name, avatar_url)
          `)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeConversation}),and(sender_id.eq.${activeConversation},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching conversation messages:', error);
          setError('Failed to load messages. Please try again.');

          const activeUser = conversations.find(c => c.user.id === activeConversation)?.user;

          if (activeUser) {
            const mockMessages: Message[] = [
              {
                id: 'msg1',
                sender_id: user.id,
                receiver_id: activeUser.id,
                content: 'Hey there! How are you doing?',
                created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                is_read: true,
                sender: {
                  username: user.user_metadata.username || 'me',
                  name: user.user_metadata.name || 'Me',
                  avatar_url: user.user_metadata.avatar_url || '/general/avatar.png'
                },
                receiver: activeUser
              },
              {
                id: 'msg2',
                sender_id: activeUser.id,
                receiver_id: user.id,
                content: 'I\'m doing great! Just checking out this app.',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                is_read: true,
                sender: activeUser,
                receiver: {
                  username: user.user_metadata.username || 'me',
                  name: user.user_metadata.name || 'Me',
                  avatar_url: user.user_metadata.avatar_url || '/general/avatar.png'
                }
              },
              {
                id: 'msg3',
                sender_id: user.id,
                receiver_id: activeUser.id,
                content: 'It\'s pretty cool, right? They just added this messaging feature!',
                created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                is_read: true,
                sender: {
                  username: user.user_metadata.username || 'me',
                  name: user.user_metadata.name || 'Me',
                  avatar_url: user.user_metadata.avatar_url || '/general/avatar.png'
                },
                receiver: activeUser
              }
            ];

            if (activeUser.id === 'user1') {
              mockMessages.push(
                {
                  id: 'msg4',
                  sender_id: activeUser.id,
                  receiver_id: user.id,
                  content: 'Yeah, the messaging is great! Did you also see they added bookmarks collections?',
                  created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
                  is_read: true,
                  sender: activeUser,
                  receiver: {
                    username: user.user_metadata.username || 'me',
                    name: user.user_metadata.name || 'Me',
                    avatar_url: user.user_metadata.avatar_url || '/general/avatar.png'
                  }
                },
                {
                  id: 'msg5',
                  sender_id: activeUser.id,
                  receiver_id: user.id,
                  content: 'Hey! Are you still there?',
                  created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
                  is_read: false,
                  sender: activeUser,
                  receiver: {
                    username: user.user_metadata.username || 'me',
                    name: user.user_metadata.name || 'Me',
                    avatar_url: user.user_metadata.avatar_url || '/general/avatar.png'
                  }
                }
              );
            }

            setMessages(mockMessages);
          }
        } else {
          setMessages(data || []);

          const unreadMessages = data?.filter(
            (msg: Message) => msg.receiver_id === user.id && !msg.is_read
          ) || [];

          if (unreadMessages.length > 0) {
            const { error: updateError } = await supabase
              .from('messages')
              .update({ is_read: true })
              .in('id', unreadMessages.map(msg => msg.id));

            if (updateError) {
              console.error('Error marking messages as read:', updateError);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching conversation messages:', err);
        setError('Failed to load messages. Please try again.');
      }

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };

    fetchActiveConversationMessages();

    const subscription = supabase
      .channel(`messages-${activeConversation}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(and(sender_id=eq.${user?.id},receiver_id=eq.${activeConversation}),and(sender_id=eq.${activeConversation},receiver_id=eq.${user?.id}))`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, activeConversation, conversations]);

  const sendMessage = async () => {
    if (!user || !activeConversation || !newMessage.trim()) return;

    setIsSending(true);

    try {
      const messageData = {
        sender_id: user.id,
        receiver_id: activeConversation,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        is_read: false
      };

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) {
        console.error('Error sending message:', error);
        setError('Failed to send message. Please try again.');
      } else {
        setNewMessage('');
      }
    } catch (err) {
      console.error('Error in sendMessage:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col h-screen">
      <div className="sticky top-0 z-10 bg-black bg-opacity-80 backdrop-blur-md">
        <div className="px-4 py-3 border-b border-borderGray flex items-center justify-between">
          <h1 className="text-xl font-bold">
            {activeConversation && conversations.find(c => c.user.id === activeConversation) ? conversations.find(c => c.user.id === activeConversation)?.user.name : 'Messages'}
          </h1>
          {activeConversation && (
            <button
              onClick={() => setActiveConversation(null)}
              className="text-blue-500 text-sm"
            >
              Back to all messages
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 m-4 p-3 rounded-md">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : activeConversation ? (
        <div className="flex flex-col flex-grow overflow-hidden">
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.length > 0 ? messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${message.sender_id === user?.id ? 'bg-blue-500 rounded-tl-xl rounded-tr-xl rounded-bl-xl' : 'bg-gray-800 rounded-tl-xl rounded-tr-xl rounded-br-xl'} p-3`}>
                  <p className="text-white">{message.content}</p>
                  <p className="text-xs text-gray-300 mt-1 text-right">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Start a conversation with {conversations.find(c => c.user.id === activeConversation)?.user.name}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-borderGray">
            <div className="flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow bg-gray-800 rounded-full py-2 px-4 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSending}
                className="ml-2 bg-blue-500 text-white rounded-full p-2 disabled:opacity-50"
              >
                {isSending ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent border-white" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : conversations.length > 0 ? (
        <div className="divide-y divide-borderGray">
          {conversations.map(conversation => (
            <div
              key={conversation.user.id}
              className="p-4 hover:bg-gray-900 cursor-pointer"
              onClick={() => setActiveConversation(conversation.user.id)}
            >
              <div className="flex items-start">
                <div className="relative mr-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      path={conversation.user.avatar_url || '/general/avatar.png'}
                      alt={conversation.user.name}
                      w={48}
                      h={48}
                      className="object-cover"
                    />
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold truncate">{conversation.user.name}</h3>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: false })}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm text-gray-400 truncate">
                      {conversation.lastMessage.sender_id === user?.id ? 'You: ' : ''}
                      {conversation.lastMessage.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-12 h-12 text-gray-500 mx-auto mb-4">
            <g>
              <path fill="currentColor" d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.636V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.636-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z"></path>
            </g>
          </svg>
          <p className="text-lg text-textGray">No messages yet</p>
          <p className="text-sm text-textGray mt-2">When you have messages, they'll show up here</p>
          <h2 className="text-2xl font-bold mb-2 mt-4">Welcome to your inbox!</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            Drop a line, share posts and more with private conversations between you and others on X.
          </p>
          <button className="bg-blue-500 text-white font-bold rounded-full px-5 py-2 mt-4 hover:bg-blue-600 transition">
            Write a message
          </button>
        </div>
      )}
    </div>
  );
}
