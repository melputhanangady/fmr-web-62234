import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { isDemoMode } from '../../utils/demoMode';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';
import NotificationIcon from '../NotificationIcon';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const fetchUserName = async (userId: string) => {
      console.log('Header: fetchUserName called for userId:', userId);
      
      if (!userId) {
        console.log('Header: No userId, clearing userName');
        setUserName('');
        return;
      }

      try {
        if (isDemoMode()) {
          // In demo mode, get name from localStorage
          const demoProfile = localStorage.getItem('demo-user-profile');
          if (demoProfile) {
            const userData = JSON.parse(demoProfile);
            console.log('Header: Demo mode - setting userName to:', userData.name);
            setUserName(userData.name || 'User');
          } else {
            console.log('Header: Demo mode - no demo profile found');
            setUserName('User');
          }
        } else {
          // In production mode, get name from Firestore
          console.log('Header: Production mode - fetching from Firestore for user:', userId);
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Header: Firestore user data:', userData);
            setUserName(userData.name || 'User');
          } else {
            console.log('Header: No user document found in Firestore');
            setUserName('User');
          }
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
        setUserName('User');
      }
    };

    // Listen to auth state changes directly
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Header: Auth state changed, user:', user?.uid);
      if (user) {
        fetchUserName(user.uid);
      } else {
        setUserName('');
      }
    });

    // Also fetch for current user if available
    if (currentUser?.uid) {
      fetchUserName(currentUser.uid);
    }

    return () => unsubscribe();
  }, []); // Empty dependency array since we're using onAuthStateChanged

  const handleLogout = async () => {
    try {
      await logout();
      setUserName(''); // Clear userName on logout
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleMatchesClick = () => {
    navigate('/matches');
  };

  const handleLikesClick = () => {
    navigate('/likes');
  };

  return (
    <header className="bg-background border-b border-border px-6 py-4 shadow-sm">
      <div className="flex justify-end items-center space-x-4">
        {/* Notification Icon */}
        <NotificationIcon />
        
        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium">
                  {userName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">Signed in</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{userName || 'User'}</p>
              <p className="text-xs text-muted-foreground">Signed in</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick}>
              👤 Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleMatchesClick}>
              💕 My Matches
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLikesClick}>
              ❤️ My Likes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              🚪 Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;