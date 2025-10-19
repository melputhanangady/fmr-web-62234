import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getNotificationCounts, subscribeToNotifications, markAllNotificationsAsSeen, type NotificationData } from '../services/notificationService';
import { Bell, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNavigate } from 'react-router-dom';

const NotificationIcon: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationData>({
    newMatches: 0,
    newLikes: 0,
    totalNotifications: 0
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications({
        newMatches: 0,
        newLikes: 0,
        totalNotifications: 0
      });
      return;
    }

    // Get initial notification counts
    const loadNotifications = async () => {
      try {
        const counts = await getNotificationCounts(currentUser.uid);
        setNotifications(counts);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();

    // Set up real-time listener
    const listener = subscribeToNotifications(currentUser.uid, (newNotifications) => {
      setNotifications(newNotifications);
    });

    return () => {
      listener.unsubscribe();
    };
  }, [currentUser?.uid]);

  const handleNotificationClick = async (type: 'matches' | 'likes') => {
    setIsOpen(false);
    
    // Mark all notifications as seen when user clicks on any notification
    if (currentUser?.uid) {
      try {
        await markAllNotificationsAsSeen(currentUser.uid);
      } catch (error) {
        console.error('Error marking notifications as seen:', error);
      }
    }
    
    if (type === 'matches') {
      navigate('/matches');
    } else {
      navigate('/discover');
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-5 w-5" />
          {notifications.totalNotifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {notifications.totalNotifications > 99 ? '99+' : notifications.totalNotifications}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Notifications</h4>
            {notifications.totalNotifications > 0 && (
              <Badge variant="secondary">
                {notifications.totalNotifications} new
              </Badge>
            )}
          </div>
          
          <div className="space-y-3">
            {/* New Matches */}
            <div 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleNotificationClick('matches')}
            >
              <div className="flex-shrink-0">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  New Matches
                </p>
                <p className="text-sm text-gray-500">
                  {notifications.newMatches} new match{notifications.newMatches !== 1 ? 'es' : ''}
                </p>
              </div>
              {notifications.newMatches > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {notifications.newMatches}
                </Badge>
              )}
            </div>

            {/* New Likes */}
            <div 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleNotificationClick('likes')}
            >
              <div className="flex-shrink-0">
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  New Likes
                </p>
                <p className="text-sm text-gray-500">
                  {notifications.newLikes} new like{notifications.newLikes !== 1 ? 's' : ''}
                </p>
              </div>
              {notifications.newLikes > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {notifications.newLikes}
                </Badge>
              )}
            </div>
          </div>

          {notifications.totalNotifications === 0 && (
            <div className="text-center py-4">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No new notifications</p>
            </div>
          )}

          <div className="border-t pt-3 space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                setIsOpen(false);
                navigate('/matches');
              }}
            >
              View All Matches
            </Button>
            
            {notifications.totalNotifications > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={async () => {
                  if (currentUser?.uid) {
                    try {
                      await markAllNotificationsAsSeen(currentUser.uid);
                      setIsOpen(false);
                    } catch (error) {
                      console.error('Error marking notifications as seen:', error);
                    }
                  }
                }}
              >
                Mark All as Seen
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationIcon;
