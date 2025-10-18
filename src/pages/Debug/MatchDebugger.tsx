import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { debugUserMatches, fixUserMatches, rebuildUserMatches, checkUserInMatch, fixUserInMatch } from '../../utils/matchDebugger';
import type { MatchDebugResult } from '../../utils/matchDebugger';

const MatchDebugger: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [debugResult, setDebugResult] = useState<MatchDebugResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const { currentUser } = useAuth();

  const handleDebug = async () => {
    if (!userId.trim()) return;
    
    setLoading(true);
    try {
      const result = await debugUserMatches(userId);
      setDebugResult(result);
    } catch (error) {
      console.error('Error debugging matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFix = async () => {
    if (!userId.trim()) return;
    
    setFixing(true);
    try {
      const success = await fixUserMatches(userId);
      if (success) {
        alert('Matches fixed successfully!');
        // Re-run debug to see updated results
        await handleDebug();
      } else {
        alert('Failed to fix matches');
      }
    } catch (error) {
      console.error('Error fixing matches:', error);
      alert('Error fixing matches');
    } finally {
      setFixing(false);
    }
  };

  const handleRebuild = async () => {
    if (!userId.trim()) return;
    
    setFixing(true);
    try {
      const matchIds = await rebuildUserMatches(userId);
      alert(`Rebuilt matches: ${matchIds.length} matches found`);
      // Re-run debug to see updated results
      await handleDebug();
    } catch (error) {
      console.error('Error rebuilding matches:', error);
      alert('Error rebuilding matches');
    } finally {
      setFixing(false);
    }
  };

  const handleCheckMatch = async (matchId: string) => {
    if (!userId.trim() || !matchId.trim()) return;
    
    setLoading(true);
    try {
      const result = await checkUserInMatch(userId, matchId);
      if (result.success) {
        if (result.userInMatch) {
          alert(`User ${userId} is properly included in match ${matchId}`);
        } else {
          alert(`User ${userId} is NOT in match ${matchId} users array. This is likely the cause of permission errors.`);
        }
      } else {
        alert(`Error checking match: ${result.error}`);
      }
    } catch (error) {
      console.error('Error checking match:', error);
      alert('Error checking match. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFixMatch = async (matchId: string) => {
    if (!userId.trim() || !matchId.trim()) return;
    
    setFixing(true);
    try {
      const result = await fixUserInMatch(userId, matchId);
      if (result.success) {
        alert(`Fixed user ${userId} in match ${matchId}`);
        // Re-debug to show updated results
        await handleDebug();
      } else {
        alert(`Error fixing match: ${result.error}`);
      }
    } catch (error) {
      console.error('Error fixing match:', error);
      alert('Error fixing match. Check console for details.');
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Match Debugger</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug User Matches</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={() => setUserId(currentUser?.uid || '')}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Use Current User
              </button>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleDebug}
              disabled={loading || !userId.trim()}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:bg-gray-300"
            >
              {loading ? 'Debugging...' : 'Debug Matches'}
            </button>
            
            <button
              onClick={handleFix}
              disabled={fixing || !debugResult}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-gray-300"
            >
              {fixing ? 'Fixing...' : 'Fix Issues'}
            </button>
            
            <button
              onClick={handleRebuild}
              disabled={fixing || !userId.trim()}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300"
            >
              {fixing ? 'Rebuilding...' : 'Rebuild All Matches'}
            </button>
          </div>
        </div>

        {debugResult && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Basic Info</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>User ID:</strong> {debugResult.userId}</div>
                  <div><strong>User Exists:</strong> {debugResult.userExists ? '✅ Yes' : '❌ No'}</div>
                  <div><strong>Match IDs:</strong> {debugResult.matchIds.length}</div>
                  <div><strong>Valid Matches:</strong> {debugResult.validMatches.length}</div>
                  <div><strong>Invalid Matches:</strong> {debugResult.invalidMatches.length}</div>
                  <div><strong>Orphaned Matches:</strong> {debugResult.orphanedMatches.length}</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Issues Found</h3>
                {debugResult.issues.length === 0 ? (
                  <div className="text-green-600">✅ No issues found</div>
                ) : (
                  <ul className="space-y-1 text-sm text-red-600">
                    {debugResult.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            {debugResult.matchIds.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Match Details</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Match IDs:</strong> {debugResult.matchIds.join(', ')}</div>
                  {debugResult.matchIds.map(matchId => (
                    <div key={matchId} className="flex items-center gap-2">
                      <span><strong>Match {matchId}:</strong></span>
                      <button
                        onClick={() => handleCheckMatch(matchId)}
                        disabled={loading}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-300"
                      >
                        Check
                      </button>
                      <button
                        onClick={() => handleFixMatch(matchId)}
                        disabled={fixing}
                        className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:bg-gray-300"
                      >
                        Fix
                      </button>
                    </div>
                  ))}
                  {debugResult.validMatches.length > 0 && (
                    <div><strong>Valid Matches:</strong> {debugResult.validMatches.join(', ')}</div>
                  )}
                  {debugResult.invalidMatches.length > 0 && (
                    <div><strong>Invalid Matches:</strong> {debugResult.invalidMatches.join(', ')}</div>
                  )}
                  {debugResult.orphanedMatches.length > 0 && (
                    <div><strong>Orphaned Matches:</strong> {debugResult.orphanedMatches.join(', ')}</div>
                  )}
                </div>
              </div>
            )}
            
            {debugResult.otherUsers.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Other Users</h3>
                <div className="space-y-2 text-sm">
                  {debugResult.otherUsers.map((otherUser, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span><strong>User {index + 1}:</strong> {otherUser.userId}</span>
                      <span className={otherUser.exists ? 'text-green-600' : 'text-red-600'}>
                        {otherUser.exists ? '✅' : '❌'}
                      </span>
                      <span className={otherUser.hasMatch ? 'text-green-600' : 'text-yellow-600'}>
                        {otherUser.hasMatch ? '✅' : '⚠️'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {debugResult.recommendations.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                <ul className="space-y-1 text-sm text-blue-600">
                  {debugResult.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDebugger;
