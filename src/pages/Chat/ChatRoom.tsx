import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { subscribeToMessages, sendMessage, markMessagesAsRead } from '../../services/chatService';
import type { Message } from '../../types';
import toast from 'react-hot-toast';

const ChatRoom: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<{ id: string; name: string; photos: string[] } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !userId) return;

    const loadChatData = async () => {
      try {
        setLoading(true);
        
        // Get other user's profile
        const otherUserRef = doc(db, 'users', userId);
        const otherUserDoc = await getDoc(otherUserRef);
        
        if (!otherUserDoc.exists()) {
          toast.error('User not found');
          navigate('/matches');
          return;
        }

        const otherUserData = otherUserDoc.data();
        setOtherUser({
          id: userId,
          name: otherUserData.name,
          photos: otherUserData.photos || []
        });

        // Find the match ID
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const matchIds = userData.matches || [];
          
          // Find match that contains both users
          let matchId = '';
          for (const id of matchIds) {
            const matchRef = doc(db, 'matches', id);
            const matchDoc = await getDoc(matchRef);
            
            if (matchDoc.exists()) {
              const matchData = matchDoc.data();
              if (matchData.users.includes(userId)) {
                matchId = id;
                break;
              }
            }
          }

          if (matchId) {
            // Subscribe to messages
            const unsubscribe = subscribeToMessages(matchId, (newMessages) => {
              setMessages(newMessages);
              setLoading(false);
            });

            // Mark messages as read
            await markMessagesAsRead(matchId, currentUser.uid);

            return () => unsubscribe();
          } else {
            toast.error('Match not found');
            navigate('/matches');
          }
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
        toast.error('Failed to load chat');
        navigate('/matches');
      }
    };

    loadChatData();
  }, [currentUser, userId, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser || !userId || sending) return;

    try {
      setSending(true);
      
      // Find match ID
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const matchIds = userData.matches || [];
        
        let matchId = '';
        for (const id of matchIds) {
          const matchRef = doc(db, 'matches', id);
          const matchDoc = await getDoc(matchRef);
          
          if (matchDoc.exists()) {
            const matchData = matchDoc.data();
            if (matchData.users.includes(userId)) {
              matchId = id;
              break;
            }
          }
        }

        if (matchId) {
          await sendMessage(matchId, currentUser.uid, newMessage.trim());
          setNewMessage('');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
    </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/matches')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <img
            src={otherUser.photos[0] || '/default-avatar.png'}
            alt={otherUser.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{otherUser.name}</h2>
            <p className="text-sm text-gray-500">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.senderId === currentUser?.uid
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-900'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.senderId === currentUser?.uid
                    ? 'text-primary-100'
                    : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white p-3 rounded-full transition-colors"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
