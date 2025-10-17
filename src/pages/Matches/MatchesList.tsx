import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMatchesWithUsers } from '../../services/chatService';
import { isDemoMode } from '../../utils/demoMode';
import { getDemoUsers } from '../../utils/demoUsers';
import type { ChatUser } from '../../types';
import toast from 'react-hot-toast';

const MatchesList: React.FC = () => {
  const [matches, setMatches] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Load demo matches from localStorage
  const loadDemoMatches = async (userId: string): Promise<ChatUser[]> => {
    try {
      // Get user's match IDs from localStorage
      const userMatches = JSON.parse(localStorage.getItem(`demo-user-matches-${userId}`) || '[]');
      
      console.log('Loading demo matches for user:', userId);
      console.log('User matches from localStorage:', userMatches);
      
      if (userMatches.length === 0) {
        console.log('No matches found for user');
        return [];
      }

      // Get all demo matches
      const allMatches = JSON.parse(localStorage.getItem('demo-matches') || '[]');
      console.log('All demo matches:', allMatches);
      
      const userMatchObjects = allMatches.filter((match: any) => userMatches.includes(match.id));
      console.log('User match objects:', userMatchObjects);
      
      // Get demo users for profile data
      const demoUsers = getDemoUsers();
      console.log('Demo users:', demoUsers);
      const matches: ChatUser[] = [];
      
      for (const match of userMatchObjects) {
        const otherUserId = match.users.find((id: string) => id !== userId);
        
        if (otherUserId) {
          // Find the other user in demo users
          const otherUser = demoUsers.find(user => user.id === otherUserId);
          
          if (otherUser) {
            matches.push({
              id: otherUserId,
              name: otherUser.name,
              photos: otherUser.photos,
              lastMessage: '',
              lastMessageTime: new Date(match.createdAt),
              unreadCount: 0
            });
          }
        }
      }
      
      // Sort by match creation time
      return matches.sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
      });
    } catch (error) {
      console.error('Error loading demo matches:', error);
      return [];
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const loadMatches = async () => {
      try {
        setLoading(true);
        
        if (isDemoMode()) {
          // Load demo matches from localStorage
          const demoMatches = await loadDemoMatches(currentUser.uid);
          setMatches(demoMatches);
        } else {
          // Load real matches from Firebase
          const matchesData = await getMatchesWithUsers(currentUser.uid);
          setMatches(matchesData);
        }
      } catch (error) {
        console.error('Error loading matches:', error);
        toast.error('Failed to load matches');
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [currentUser]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const openChat = (userId: string) => {
    navigate(`/chat/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">💔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No matches yet</h2>
          <p className="text-gray-600 mb-6">
            Start swiping to find your perfect match!
          </p>
          <button
            onClick={() => navigate('/discover')}
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Start Swiping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Matches</h1>
          <p className="text-gray-600">{matches.length} match{matches.length !== 1 ? 'es' : ''}</p>
          
          {/* Demo mode notice */}
          {isDemoMode() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-800">
                <strong>Demo Mode:</strong> These are simulated matches. 
                Set up Firebase to enable real matching and chat functionality.
              </p>
              <button
                onClick={() => {
                  console.log('=== DEBUG INFO ===');
                  console.log('Current user ID:', currentUser?.uid);
                  console.log('Demo matches:', JSON.parse(localStorage.getItem('demo-matches') || '[]'));
                  console.log('User matches:', JSON.parse(localStorage.getItem(`demo-user-matches-${currentUser?.uid}`) || '[]'));
                  console.log('User likes:', JSON.parse(localStorage.getItem(`demo-likes-${currentUser?.uid}`) || '[]'));
                  console.log('Demo user profile:', JSON.parse(localStorage.getItem('demo-user-profile') || '{}'));
                }}
                className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Debug localStorage
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.id}
              onClick={() => openChat(match.id)}
              className="bg-white rounded-2xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={match.photos[0] || '/default-avatar.png'}
                    alt={match.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  {match.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                      {match.unreadCount}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {match.name}
                    </h3>
                    {match.lastMessageTime && (
                      <span className="text-sm text-gray-500">
                        {formatTime(match.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  
                  {match.lastMessage && (
                    <p className="text-gray-600 truncate">
                      {match.lastMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchesList;
