import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MapPin, ArrowLeft, Eye, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUsersWhoLikedMe } from '../../services/notificationService';
import { likeUser } from '../../services/matchService';
import type { User } from '../../types';

const LikedByList: React.FC = () => {
  const [likedByUsers, setLikedByUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser?.uid) {
      fetchLikedByUsers();
    }
  }, [currentUser?.uid]);

  const fetchLikedByUsers = async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      const users = await getUsersWhoLikedMe(currentUser.uid);
      setLikedByUsers(users);
    } catch (error) {
      console.error('Error fetching users who liked me:', error);
      toast({
        title: "Error",
        description: "Failed to load users who liked you",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (userId: string) => {
    if (!currentUser?.uid || actionLoading) return;

    setActionLoading(userId);
    try {
      const result = await likeUser(currentUser.uid, userId);
      
      if (result.isMatch) {
        toast({
          title: "It's a Match! 🎉",
          description: `You and ${likedByUsers.find(u => u.id === userId)?.name} liked each other!`,
        });
        // Navigate to matches after a short delay
        setTimeout(() => {
          navigate('/matches');
        }, 2000);
      } else {
        toast({
          title: "Like Sent! 💕",
          description: "Your like has been sent!",
        });
      }
    } catch (error) {
      console.error('Error liking user:', error);
      toast({
        title: "Error",
        description: "Failed to like user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="h-8 w-8 text-pink-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Who Liked You</h1>
              <p className="text-gray-600">People who have liked your profile</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{likedByUsers.length} people liked you</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4 text-pink-500" />
              <span>Like them back to match!</span>
            </div>
          </div>
        </div>

        {likedByUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Heart className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Likes Yet</h2>
            <p className="text-gray-600 mb-6">
              Keep swiping to get more likes! Your profile will appear in other people's discovery queue.
            </p>
            <Button onClick={() => navigate('/discover')}>
              Start Discovering
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedByUsers.map((user) => (
              <Card key={user.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
                <CardContent className="p-0 flex flex-col h-full">
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
                  </div>

                  {/* Profile Info */}
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
                        <div className="flex items-center text-gray-600 text-sm">
                          <MapPin className="h-4 w-4 mr-1" />
                          {user.city}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-sm">
                        {user.age}
                      </Badge>
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
                    <div className="flex space-x-2 mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewProfile(user.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={() => handleLike(user.id)}
                        disabled={actionLoading === user.id}
                      >
                        <Heart className="w-4 h-4 mr-1" />
                        {actionLoading === user.id ? 'Liking...' : 'Like Back'}
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

export default LikedByList;
