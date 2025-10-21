import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Users } from 'lucide-react';

interface MatchMakerRouteProps {
  children: React.ReactNode;
}

const MatchMakerRoute: React.FC<MatchMakerRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isMatchMaker, setIsMatchMaker] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMatchMakerStatus = async () => {
      if (!currentUser) {
        setIsMatchMaker(false);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsMatchMaker(userData.role === 'matchmaker');
        } else {
          setIsMatchMaker(false);
        }
      } catch (error) {
        console.error('Error checking matchmaker status:', error);
        setIsMatchMaker(false);
      } finally {
        setLoading(false);
      }
    };

    checkMatchMakerStatus();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to access this page.
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!isMatchMaker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">MatchMaker Access Required</h2>
          <p className="text-gray-600 mb-6">
            This feature is only available to verified MatchMakers. 
            You need to sign up as a MatchMaker to access these tools.
          </p>
          <div className="space-y-3">
            <Button onClick={() => window.history.back()} variant="outline">
              Go Back
            </Button>
            <Button onClick={() => window.location.href = '/discover'}>
              Go to Discover
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MatchMakerRoute;
