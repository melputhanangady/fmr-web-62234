import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { isDemoMode } from '../../utils/demoMode';
import { removeLike } from '../../services/notificationService';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../types';

interface LikedUser extends User {
  id: string;
  isMatched: boolean;
}

const LikesList: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLikedUsers = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (isDemoMode()) {
          // Demo mode - show mock data
          const mockLikedUsers: LikedUser[] = [
            {
              id: 'demo-user-1',
              name: 'Sarah Johnson',
              age: 25,
              bio: 'Love hiking and photography',
              city: 'San Francisco',
              interests: ['Photography', 'Hiking', 'Travel'],
              photos: ['/demo-photo-1.jpg'],
              preferences: {
                minAge: 22,
                maxAge: 30,
                interestedIn: 'men',
                cities: ['San Francisco', 'Oakland']
              },
              likedUsers: [],
              passedUsers: [],
              matches: [],
              isMatched: false
            },
            {
              id: 'demo-user-2',
              name: 'Emma Wilson',
              age: 28,
              bio: 'Artist and yoga enthusiast',
              city: 'Los Angeles',
              interests: ['Art', 'Yoga', 'Meditation'],
              photos: ['/demo-photo-2.jpg'],
              preferences: {
                minAge: 25,
                maxAge: 35,
                interestedIn: 'men',
                cities: ['Los Angeles', 'San Diego']
              },
              likedUsers: [],
              passedUsers: [],
              matches: [],
              isMatched: false
            }
          ];
          setLikedUsers(mockLikedUsers);
          setLoading(false);
          return;
        }

        // Production mode - get real data
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          setError('User profile not found');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        const likedUserIds = userData.likedUsers || [];
        const userMatches = userData.matches || [];

        if (likedUserIds.length === 0) {
          setLikedUsers([]);
          setLoading(false);
          return;
        }

        // Get all liked users' profiles
        const likedUsersData: LikedUser[] = [];
        
        for (const likedUserId of likedUserIds) {
          try {
            const likedUserRef = doc(db, 'users', likedUserId);
            const likedUserDoc = await getDoc(likedUserRef);
            
            if (likedUserDoc.exists()) {
              const likedUserData = likedUserDoc.data() as User;
              
              // Check if this user is matched with the current user
              const likedUserMatches = likedUserData.matches || [];
              const isMatched = userMatches.some((matchId: string) => 
                likedUserMatches.includes(matchId)
              );

              likedUsersData.push({
                ...likedUserData,
                id: likedUserId,
                isMatched
              });
            }
          } catch (error) {
            console.error(`Error loading user ${likedUserId}:`, error);
          }
        }

        // Filter out matched users - only show unmatched likes
        const unmatchedLikes = likedUsersData.filter(user => !user.isMatched);
        setLikedUsers(unmatchedLikes);
        
      } catch (error) {
        console.error('Error loading liked users:', error);
        setError('Failed to load liked users');
      } finally {
        setLoading(false);
      }
    };

    loadLikedUsers();
  }, [currentUser?.uid]);

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleRemoveLike = async (userId: string) => {
    if (!currentUser?.uid) return;
    
    try {
      const success = await removeLike(currentUser.uid, userId);
      if (success) {
        // Remove the user from the local state
        setLikedUsers(prev => prev.filter(user => user.id !== userId));
      } else {
        alert('Failed to remove like. Please try again.');
      }
    } catch (error) {
      console.error('Error removing like:', error);
      alert('Failed to remove like. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your likes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <Heart className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Likes</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="h-8 w-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Likes</h1>
              <p className="text-gray-600">People you've liked but haven't matched with yet</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{likedUsers.length} liked profiles</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4 text-red-500" />
              <span>Waiting for mutual likes</span>
            </div>
          </div>
        </div>

        {likedUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Heart className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Likes Yet</h2>
            <p className="text-gray-600 mb-6">
              Start discovering people and like profiles you're interested in!
            </p>
            <Button onClick={() => navigate('/discover')}>
              Start Discovering
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedUsers.map((user) => (
              <Card key={user.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Profile Photo */}
                  <div className="relative h-48 bg-gray-200">
                    {user.photos && user.photos.length > 0 ? (
                      <img
                        src={user.photos[0]}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    
                    {/* Age Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-white/90 text-gray-900">
                        {user.age}
                      </Badge>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
                        <div className="flex items-center text-gray-600 text-sm">
                          <MapPin className="h-4 w-4 mr-1" />
                          {user.city}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                      {user.bio}
                    </p>

                    {/* Interests */}
                    {user.interests && user.interests.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {user.interests.slice(0, 3).map((interest, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                          {user.interests.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.interests.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewProfile(user.id)}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLike(user.id)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LikesList;
