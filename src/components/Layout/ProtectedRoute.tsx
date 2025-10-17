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

  React.useEffect(() => {
    if (!currentUser || !requireProfile) {
      setCheckingProfile(false);
      return;
    }

    const checkProfile = async () => {
      try {
        if (isDemoMode()) {
          // In demo mode, check localStorage for profile
          const demoProfile = localStorage.getItem('demo-user-profile');
          setProfileExists(!!demoProfile);
        } else {
          // In production mode, check Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          setProfileExists(userDoc.exists());
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        setProfileExists(false);
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

  if (requireProfile && profileExists === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
