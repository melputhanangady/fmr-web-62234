import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { rateLimiter } from '../../utils/rateLimiter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const RateLimitDebugger: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [rateLimitStatus, setRateLimitStatus] = useState<Record<string, any>>({});

  const actions = ['profile_create', 'profile_update', 'like', 'pass', 'message', 'photo_upload', 'login_attempt'];

  useEffect(() => {
    if (currentUser) {
      updateStatus();
    }
  }, [currentUser]);

  const updateStatus = () => {
    if (!currentUser) return;

    const status: Record<string, any> = {};
    actions.forEach(action => {
      status[action] = rateLimiter.getStatus(currentUser.uid, action);
    });
    setRateLimitStatus(status);
  };

  const resetRateLimit = (action: string) => {
    if (!currentUser) return;
    
    rateLimiter.reset(currentUser.uid, action);
    updateStatus();
    
    toast({
      title: "Rate Limit Reset",
      description: `Rate limit for ${action} has been reset.`,
    });
  };

  const resetAllRateLimits = () => {
    if (!currentUser) return;
    
    rateLimiter.reset(currentUser.uid);
    updateStatus();
    
    toast({
      title: "All Rate Limits Reset",
      description: "All rate limits have been reset for this user.",
    });
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = (status: any) => {
    if (status.blockedUntil && Date.now() < status.blockedUntil) {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    if (status.allowed) {
      return <Badge variant="default">Allowed</Badge>;
    }
    return <Badge variant="secondary">Limited</Badge>;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in to view rate limit status.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rate Limit Debugger</h1>
          <p className="text-gray-600">Monitor and manage rate limits for user: {currentUser.uid}</p>
        </div>

        <div className="grid gap-6">
          {actions.map(action => {
            const status = rateLimitStatus[action];
            if (!status) return null;

            return (
              <Card key={action}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{action.replace('_', ' ')}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(status)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resetRateLimit(action)}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Allowed</p>
                      <p className="text-lg font-semibold">{status.allowed ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Remaining Requests</p>
                      <p className="text-lg font-semibold">{status.remainingRequests || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Reset Time</p>
                      <p className="text-sm">{formatTime(status.resetTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Blocked Until</p>
                      <p className="text-sm">{formatTime(status.blockedUntil)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={resetAllRateLimits}
            variant="destructive"
            size="lg"
          >
            Reset All Rate Limits
          </Button>
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={updateStatus}
            variant="outline"
          >
            Refresh Status
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RateLimitDebugger;
