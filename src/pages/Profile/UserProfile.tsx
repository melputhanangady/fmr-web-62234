import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { removeLike } from '../../services/notificationService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MapPin, Calendar, Heart, X } from 'lucide-react';
import type { User } from '../../types';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isRemovingLike, setIsRemovingLike] = useState(false);

  useEffect(() => {
    if (!userId) {
      setError('User ID not provided');
      setLoading(false);
      return;
    }

    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          setError('User profile not found');
          setLoading(false);
          return;
        }

        const userData = userDoc.data() as User;
        setUser(userData);

        // Check if current user has already liked this user
        if (currentUser?.uid) {
          const currentUserRef = doc(db, 'users', currentUser.uid);
          const currentUserDoc = await getDoc(currentUserRef);
          
          if (currentUserDoc.exists()) {
            const currentUserData = currentUserDoc.data();
            const likedUsers = currentUserData.likedUsers || [];
            setIsLiked(likedUsers.includes(userId));
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userId]);

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleLike = () => {
    // TODO: Implement like functionality
    console.log('Like user:', userId);
  };

  const handleNotInterested = async () => {
    if (!currentUser?.uid || !userId || isRemovingLike) return;
    
    try {
      setIsRemovingLike(true);
      
      // Remove the like using the notification service
      const success = await removeLike(currentUser.uid, userId);
      
      if (success) {
        setIsLiked(false);
        // Navigate back to likes page since the like was removed
        navigate('/likes');
      } else {
        console.error('Failed to remove like');
      }
    } catch (error) {
      console.error('Error removing like:', error);
    } finally {
      setIsRemovingLike(false);
    }
  };

  const nextPhoto = () => {
    if (user?.photos && user.photos.length > 1) {
      setCurrentPhotoIndex((prev) => 
        prev === user.photos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (user?.photos && user.photos.length > 1) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? user.photos.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'User profile could not be loaded'}</p>
          <Button onClick={handleBack}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">{user.name}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Photos */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden">
                  {user.photos && user.photos.length > 0 ? (
                    <>
                      <img
                        src={user.photos[currentPhotoIndex]}
                        alt={`${user.name} photo ${currentPhotoIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Photo Navigation */}
                      {user.photos.length > 1 && (
                        <>
                          <Button
                            onClick={prevPhoto}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                            size="sm"
                          >
                            ‹
                          </Button>
                          <Button
                            onClick={nextPhoto}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                            size="sm"
                          >
                            ›
                          </Button>
                          
                          {/* Photo Indicators */}
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                            {user.photos.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentPhotoIndex(index)}
                                className={`w-2 h-2 rounded-full ${
                                  index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            {isLiked ? (
              <>
                <Button
                  onClick={handleNotInterested}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  disabled={isRemovingLike}
                >
                  <X className="w-5 h-5 mr-2" />
                  {isRemovingLike ? 'Removing...' : 'Not Interested'}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  disabled
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Liked
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleNotInterested}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <X className="w-5 h-5 mr-2" />
                  Pass
                </Button>
                <Button
                  onClick={handleLike}
                  size="lg"
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Like
                </Button>
              </>
            )}
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{user.city}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {user.age}
                  </Badge>
                </div>

                <p className="text-gray-700 text-base leading-relaxed">
                  {user.bio}
                </p>
              </CardContent>
            </Card>

            {/* Basic Details */}
            {(user.education || user.occupation || user.height || user.relationshipStatus || user.lookingFor) && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Details</h3>
                  <div className="space-y-3">
                    {user.education && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Education:</span>
                        <span className="text-gray-900">{user.education}</span>
                      </div>
                    )}
                    {user.occupation && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Occupation:</span>
                        <span className="text-gray-900">{user.occupation}</span>
                      </div>
                    )}
                    {user.height && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Height:</span>
                        <span className="text-gray-900">{user.height}</span>
                      </div>
                    )}
                    {user.relationshipStatus && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Status:</span>
                        <span className="text-gray-900">{user.relationshipStatus}</span>
                      </div>
                    )}
                    {user.lookingFor && (
                      <div className="flex justify-between items-center py-2">
                        <span className="font-medium text-gray-600">Looking for:</span>
                        <span className="text-gray-900">{user.lookingFor}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hobbies */}
            {user.hobbies && user.hobbies.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Hobbies & Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.hobbies.map((hobby, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {hobby}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interests */}
            {user.interests && user.interests.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lifestyle */}
            {user.lifestyle && user.lifestyle.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Lifestyle</h3>
                  <div className="space-y-2">
                    {user.lifestyle.map((item, index) => (
                      <div key={index} className="flex items-center text-gray-700">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personality */}
            {user.personality && user.personality.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Personality</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.personality.map((trait, index) => (
                      <Badge key={index} variant="default" className="text-sm bg-blue-100 text-blue-800">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fun Facts */}
            {user.funFacts && user.funFacts.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Fun Facts</h3>
                  <div className="space-y-2">
                    {user.funFacts.map((fact, index) => (
                      <div key={index} className="flex items-start text-gray-700">
                        <span className="text-primary-500 mr-2">•</span>
                        <span>{fact}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deal Breakers */}
            {user.dealBreakers && user.dealBreakers.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Deal Breakers</h3>
                  <div className="space-y-2">
                    {user.dealBreakers.map((breaker, index) => (
                      <div key={index} className="flex items-center text-gray-700">
                        <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        {breaker}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;
