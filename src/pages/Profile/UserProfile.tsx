import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
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

  const handlePass = () => {
    // TODO: Implement pass functionality
    console.log('Pass user:', userId);
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

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                onClick={handlePass}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
