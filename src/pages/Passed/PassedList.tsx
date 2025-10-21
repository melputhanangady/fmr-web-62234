import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, X, MapPin, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { likeUser } from '../../services/matchService';
import { removeLike } from '../../services/notificationService';
import type { User } from '../../types';

const PassedList: React.FC = () => {
  const [passedUsers, setPassedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser?.uid) {
      fetchPassedUsers();
    }
  }, [currentUser?.uid]);

  const fetchPassedUsers = async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const passedUserIds = userData.passedUsers || [];
        
        if (passedUserIds.length === 0) {
          setPassedUsers([]);
          return;
        }

        // Fetch user details for each passed user
        const userPromises = passedUserIds.map(async (userId: string) => {
          const passedUserRef = doc(db, 'users', userId);
          const passedUserDoc = await getDoc(passedUserRef);
          
          if (passedUserDoc.exists()) {
            const passedUserData = passedUserDoc.data();
            return {
              id: userId,
              ...passedUserData
            } as User;
          }
          return null;
        });

        const users = (await Promise.all(userPromises)).filter(Boolean) as User[];
        setPassedUsers(users);
      }
    } catch (error) {
      console.error('Error fetching passed users:', error);
      toast({
        title: "Error",
        description: "Failed to load passed profiles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (userId: string) => {
    if (!currentUser?.uid || actionLoading) return;

    try {
      setActionLoading(userId);
      
      // Use the existing likeUser service
      const result = await likeUser(currentUser.uid, userId);
      
      if (result.success) {
        // Remove from passed users list
        setPassedUsers(prev => prev.filter(user => user.id !== userId));
        
        toast({
          title: "Profile Liked!",
          description: result.isMatch 
            ? `It's a match with ${passedUsers.find(u => u.id === userId)?.name}!` 
            : "Profile added to your likes.",
        });

        // If it's a match, navigate to matches
        if (result.isMatch) {
          setTimeout(() => {
            navigate('/matches');
          }, 2000);
        } else {
          // Navigate to likes page
          setTimeout(() => {
            navigate('/likes');
          }, 1000);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to like profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error liking user:', error);
      toast({
        title: "Error",
        description: "Failed to like profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Loading passed profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Passed Profiles</h1>
              <p className="text-gray-600">
                {passedUsers.length} profile{passedUsers.length !== 1 ? 's' : ''} you passed on
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {passedUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No passed profiles</h2>
            <p className="text-gray-600 mb-6">
              You haven't passed on any profiles yet. Start discovering to see profiles here.
            </p>
            <Button onClick={() => navigate('/discover')} className="bg-primary hover:bg-primary/90">
              Start Discovering
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {passedUsers.map((user) => (
              <Card key={user.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Profile Photo */}
                  <div className="relative h-64 bg-gray-200">
                    {user.photos && user.photos.length > 0 ? (
                      <img
                        src={user.photos[0]}
                        alt={`${user.name} photo`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Avatar className="h-24 w-24">
                          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                        <div className="flex items-center text-gray-600 text-sm mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{user.city}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-sm">
                        {user.age}
                      </Badge>
                    </div>

                    {user.bio && (
                      <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                        {user.bio}
                      </p>
                    )}

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
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        disabled
                      >
                        <X className="w-4 h-4 mr-1" />
                        Passed
                      </Button>
                      <Button
                        onClick={() => handleLike(user.id)}
                        size="sm"
                        className="flex-1 bg-primary hover:bg-primary/90"
                        disabled={actionLoading === user.id}
                      >
                        <Heart className="w-4 h-4 mr-1" />
                        {actionLoading === user.id ? 'Liking...' : 'Like'}
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

export default PassedList;
