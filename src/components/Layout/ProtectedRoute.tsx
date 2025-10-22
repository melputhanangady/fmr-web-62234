import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { isDemoMode } from '../../utils/demoMode';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfile?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireProfile = true }) => {
  const { currentUser, loading } = useAuth();
  const [profileExists, setProfileExists] = React.useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = React.useState(true);
  const [hasCheckedProfile, setHasCheckedProfile] = React.useState(false);

  React.useEffect(() => {
    if (!currentUser || !requireProfile) {
      setCheckingProfile(false);
      return;
    }

    const checkProfile = async (retryCount = 0) => {
      try {
        if (isDemoMode()) {
          // In demo mode, check localStorage for profile
          const demoProfile = localStorage.getItem('demo-user-profile');
          setProfileExists(!!demoProfile);
        } else {
          // In production mode, check Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists()) {
            setProfileExists(true);
            setHasCheckedProfile(true);
          } else if (retryCount < 2) {
            // If profile doesn't exist and we haven't retried too many times, retry after a delay
            setTimeout(() => checkProfile(retryCount + 1), (retryCount + 1) * 500);
            return;
          } else {
            setProfileExists(false);
            setHasCheckedProfile(true);
          }
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        setProfileExists(false);
        setHasCheckedProfile(true);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfile();
  }, [currentUser, requireProfile]);

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }


  // If we're still checking the profile, show loading
  if (requireProfile && !hasCheckedProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Verifying profile...</p>
        </div>
      </div>
    );
  }

  if (requireProfile && profileExists === false) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requireProfile && profileExists === true) {
  }

  return <>{children}</>;
};

export default ProtectedRoute;
