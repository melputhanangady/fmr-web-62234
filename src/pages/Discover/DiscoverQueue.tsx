import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { getPotentialMatches, likeUser, passUser } from '../../services/matchService';
import type { User } from '../../types';
import { isDemoMode } from '../../utils/demoMode';
import { getDemoUsers } from '../../utils/demoUsers';
import ProfileCard from '../../components/ProfileCard/ProfileCard';
import ExpandedProfile from '../../components/ProfileCard/ExpandedProfile';
import toast from 'react-hot-toast';

const DiscoverQueue: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [showExpandedProfile, setShowExpandedProfile] = useState(false);

  // Debug logging for state changes
  console.log('DiscoverQueue render - users:', users.length, 'currentUserIndex:', currentUserIndex, 'loading:', loading);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Demo mode match simulation
  const simulateDemoLike = async (currentUserId: string, likedUserId: string): Promise<boolean> => {
    try {
      console.log(`Simulating demo like: ${currentUserId} likes ${likedUserId}`);
      
      // Get current user's liked users from localStorage
      const currentUserLikes = JSON.parse(localStorage.getItem(`demo-likes-${currentUserId}`) || '[]');
      console.log('Current user likes:', currentUserLikes);
      
      // Add to liked users
      if (!currentUserLikes.includes(likedUserId)) {
        currentUserLikes.push(likedUserId);
        localStorage.setItem(`demo-likes-${currentUserId}`, JSON.stringify(currentUserLikes));
        console.log('Added to current user likes:', currentUserLikes);
      }

      // Check if it's a mutual like (simulate some matches)
      const likedUserLikes = JSON.parse(localStorage.getItem(`demo-likes-${likedUserId}`) || '[]');
      console.log('Liked user likes:', likedUserLikes);
      
      if (likedUserLikes.includes(currentUserId)) {
        console.log('Mutual like detected! Creating match...');
        // It's a match! Create demo match
        await createDemoMatch(currentUserId, likedUserId);
        return true;
      }

      // Simulate some random matches for demo purposes (30% chance)
      const randomChance = Math.random();
      console.log('Random chance:', randomChance, 'Threshold: 0.3');
      
      if (randomChance < 0.3) {
        console.log('Random match triggered! Creating match...');
        // Add the other user to their likes to simulate mutual like
        if (!likedUserLikes.includes(currentUserId)) {
          likedUserLikes.push(currentUserId);
          localStorage.setItem(`demo-likes-${likedUserId}`, JSON.stringify(likedUserLikes));
          console.log('Added current user to liked user likes:', likedUserLikes);
        }
        
        // Create demo match
        await createDemoMatch(currentUserId, likedUserId);
        return true;
      }

      console.log('No match created');
      return false;
    } catch (error) {
      console.error('Error simulating demo like:', error);
      return false;
    }
  };

  const createDemoMatch = async (userId1: string, userId2: string): Promise<void> => {
    try {
      const matchId = `demo-match-${Date.now()}`;
      const match = {
        id: matchId,
        users: [userId1, userId2],
        createdAt: new Date().toISOString()
      };

      console.log('Creating demo match:', match);

      // Save match to localStorage
      const existingMatches = JSON.parse(localStorage.getItem('demo-matches') || '[]');
      existingMatches.push(match);
      localStorage.setItem('demo-matches', JSON.stringify(existingMatches));
      console.log('Saved match to demo-matches:', existingMatches);

      // Add match to both users' matches
      const user1Matches = JSON.parse(localStorage.getItem(`demo-user-matches-${userId1}`) || '[]');
      const user2Matches = JSON.parse(localStorage.getItem(`demo-user-matches-${userId2}`) || '[]');
      
      user1Matches.push(matchId);
      user2Matches.push(matchId);
      
      localStorage.setItem(`demo-user-matches-${userId1}`, JSON.stringify(user1Matches));
      localStorage.setItem(`demo-user-matches-${userId2}`, JSON.stringify(user2Matches));
      
      console.log(`Added match ${matchId} to user ${userId1}:`, user1Matches);
      console.log(`Added match ${matchId} to user ${userId2}:`, user2Matches);
    } catch (error) {
      console.error('Error creating demo match:', error);
    }
  };

  const loadPotentialMatches = useCallback(async () => {
    console.log('loadPotentialMatches called, currentUser:', currentUser);
    if (!currentUser) {
      console.log('No current user, returning early');
      return;
    }

    try {
      console.log('Setting loading to true');
      setLoading(true);
      
      console.log('Checking demo mode...');
      const demoMode = isDemoMode();
      console.log('Demo mode result:', demoMode);
      
      if (demoMode) {
        console.log('Running in demo mode');
        // In demo mode, use demo users
        const demoUsers = getDemoUsers();
        console.log('Demo users loaded:', demoUsers);
        console.log('Demo users count:', demoUsers.length);
        
        // Add current user's profile as the first profile to see their own photos
        const currentUserProfile = localStorage.getItem('demo-user-profile');
        if (currentUserProfile) {
          const userData = JSON.parse(currentUserProfile);
          console.log('Current user profile from localStorage:', userData);
          
          const currentUserProfileData = {
            ...userData,
            id: currentUser.uid,
            photos: userData.photos || [] // Use photos directly from profile data
          };
          
          console.log('Current user profile data:', currentUserProfileData);
          console.log('Setting users with current user first:', [currentUserProfileData, ...demoUsers]);
          setUsers([currentUserProfileData, ...demoUsers]);
        } else {
          console.log('No current user profile found, setting demo users only');
          setUsers(demoUsers);
        }
        setCurrentUserIndex(0);
        console.log('Set current user index to 0');
      } else {
        console.log('Running in production mode (Firebase)');
        // In production mode, use Firebase
        // Get current user's data
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) {
          navigate('/onboarding');
          return;
        }

        const userData = userDoc.data() as User;
        const potentialMatches = await getPotentialMatches(currentUser.uid, userData);
        
        setUsers(potentialMatches);
        setCurrentUserIndex(0);
      }
    } catch (error) {
      console.error('Error loading potential matches:', error);
      toast.error('Failed to load potential matches');
    } finally {
      console.log('loadPotentialMatches finally block, setting loading to false');
      setLoading(false);
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    console.log('useEffect triggered, calling loadPotentialMatches');
    loadPotentialMatches();
  }, [loadPotentialMatches]);

  const handleLike = async () => {
    if (!currentUser || currentUserIndex >= users.length || actionLoading) return;

    const currentUserProfile = users[currentUserIndex];
    const isViewingOwnProfile = isDemoMode() && currentUserIndex === 0 && currentUserProfile.id === currentUser.uid;
    
    setActionLoading(true);

    try {
      if (isDemoMode()) {
        if (isViewingOwnProfile) {
          // Can't like your own profile
          toast.error("You can't like your own profile! 😄");
        } else {
          // In demo mode, simulate liking and create demo matches
          const isMatch = await simulateDemoLike(currentUser.uid, currentUserProfile.id);
          
          if (isMatch) {
            setMatchedUser(currentUserProfile);
            setShowMatchModal(true);
            toast.success("It's a match! 🎉 (Demo mode)");
          } else {
            toast.success('Like sent! 💕 (Demo mode)');
          }
        }
        
        // Move to next user
        setCurrentUserIndex(prev => prev + 1);
      } else {
        // In production mode, use Firebase
        const isMatch = await likeUser(currentUser.uid, currentUserProfile.id);
        
        if (isMatch) {
          setMatchedUser(currentUserProfile);
          setShowMatchModal(true);
          toast.success("It's a match! 🎉");
        } else {
          toast.success('Like sent! 💕');
        }

        // Move to next user
        setCurrentUserIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error liking user:', error);
      toast.error('Failed to like user');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePass = async () => {
    if (!currentUser || currentUserIndex >= users.length || actionLoading) return;

    const currentUserProfile = users[currentUserIndex];
    const isViewingOwnProfile = isDemoMode() && currentUserIndex === 0 && currentUserProfile.id === currentUser.uid;
    
    setActionLoading(true);

    try {
      if (isDemoMode()) {
        if (isViewingOwnProfile) {
          // Can't pass your own profile
          toast.error("You can't pass your own profile! 😄");
        } else {
          // In demo mode, simulate passing
          toast.success('User passed (Demo mode)');
        }
        
        // Move to next user
        setCurrentUserIndex(prev => prev + 1);
      } else {
        // In production mode, use Firebase
        await passUser(currentUser.uid, currentUserProfile.id);
        toast.success('User passed');
        
        // Move to next user
        setCurrentUserIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error passing user:', error);
      toast.error('Failed to pass user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (actionLoading) return;

    if (event.key.toLowerCase() === 'l') {
      handleLike();
    } else if (event.key.toLowerCase() === 'j') {
      handlePass();
    }
  }, [actionLoading, handleLike, handlePass]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const closeMatchModal = () => {
    setShowMatchModal(false);
    setMatchedUser(null);
  };

  const goToMatches = () => {
    navigate('/matches');
  };

  const handleExpandProfile = () => {
    setShowExpandedProfile(true);
  };

  const handleCloseExpandedProfile = () => {
    setShowExpandedProfile(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Finding potential matches...</p>
        </div>
      </div>
    );
  }

  if (users.length === 0 || currentUserIndex >= users.length) {
    console.log('No more profiles condition triggered:', {
      usersLength: users.length,
      currentUserIndex,
      users: users
    });
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No more profiles</h2>
          <p className="text-gray-600 mb-6">
            You've seen all the potential matches in your area. Check back later for new profiles!
          </p>
          <button
            onClick={loadPotentialMatches}
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

      const currentUserProfile = users[currentUserIndex];
      const isViewingOwnProfile = isDemoMode() && currentUserIndex === 0 && currentUserProfile.id === currentUser?.uid;

      return (
        <>
          {/* Subtle notification banners */}
          {isViewingOwnProfile && (
            <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    <strong>Preview Mode:</strong> You're viewing your own profile. Photos are stored locally and will be visible to others when you set up Firebase.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isDemoMode() && !isViewingOwnProfile && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Demo Mode:</strong> You're viewing sample profiles. Set up Firebase to see real users and enable matching.
                  </p>
                </div>
              </div>
            </div>
          )}

          {showExpandedProfile ? (
            /* Full width layout for expanded profile */
            <div className="w-full min-h-[600px]">
              <ExpandedProfile
                user={currentUserProfile}
                onClose={handleCloseExpandedProfile}
                onLike={handleLike}
                onPass={handlePass}
                loading={actionLoading}
              />
            </div>
          ) : (
            /* Normal layout for regular profile cards */
            <div className="flex gap-6">
              {/* Main content area */}
              <div className="flex-1 max-w-md mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
                  <p className="text-gray-600">
                    {currentUserIndex + 1} of {users.length} profiles
                  </p>
                </div>

                <ProfileCard
                  user={currentUserProfile}
                  onLike={handleLike}
                  onPass={handlePass}
                  loading={actionLoading}
                  onExpand={handleExpandProfile}
                />

                {/* Mobile notices - shown below ProfileCard on mobile */}
                <div className="lg:hidden mt-6 space-y-4">
                  {/* Additional mobile notices can go here if needed */}
                </div>
              </div>

              {/* Right sidebar with notices - desktop only */}
              <div className="w-80 hidden lg:block">
                <div className="sticky top-6 space-y-4">
                  {/* Additional desktop notices can go here if needed */}
                </div>
              </div>
            </div>
          )}

          {/* Match Modal */}
          {showMatchModal && matchedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">It's a Match!</h2>
                <p className="text-gray-600 mb-6">
                  You and {matchedUser.name} liked each other. Start a conversation!
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={closeMatchModal}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    Keep Swiping
                  </button>
                  <button
                    onClick={goToMatches}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    View Matches
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      );
};

export default DiscoverQueue;
