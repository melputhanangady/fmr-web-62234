import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';

// Pages
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ProfileSetup from './pages/Onboarding/ProfileSetup';
import DiscoverQueue from './pages/Discover/DiscoverQueue';
import MatchesList from './pages/Matches/MatchesList';
import ChatRoom from './pages/Chat/ChatRoom';
import ProfileSettings from './pages/Profile/ProfileSettings';
import UserProfile from './pages/Profile/UserProfile';
import LikesList from './pages/Likes/LikesList';
import MatchDebugger from './pages/Debug/MatchDebugger';
import ChatDebugger from './pages/Debug/ChatDebugger';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router>
        <div className="min-h-screen">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected routes */}
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute requireProfile={false}>
                  <ProfileSetup />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/discover" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DiscoverQueue />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/matches" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MatchesList />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/chat/:userId" 
              element={
                <ProtectedRoute>
                  <ChatRoom />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProfileSettings />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile/:userId" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/likes" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LikesList />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/debug/matches" 
              element={
                <ProtectedRoute>
                  <MatchDebugger />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/debug/chat" 
              element={
                <ProtectedRoute>
                  <ChatDebugger />
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/discover" replace />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/discover" replace />} />
          </Routes>
          
          </div>
          
          {/* Toast notifications */}
          <Toaster />
          <Sonner />
        </Router>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
}

export default App;