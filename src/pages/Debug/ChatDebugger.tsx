import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { fixChatBetweenUsers } from '../../utils/chatFixer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const ChatDebugger: React.FC = () => {
  const { currentUser } = useAuth();
  const [userId1, setUserId1] = useState('lotEJkYZsAgka3h78dgX54l4Me22');
  const [userId2, setUserId2] = useState('rcMxmDF3N5WRlr0LQARYSKGKc2h2');
  const [debugResult, setDebugResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);
  const [detailedDebug, setDetailedDebug] = useState<any>(null);

  const debugChat = async () => {
    if (!userId1.trim() || !userId2.trim()) return;
    
    setLoading(true);
    try {
      const result: any = {
        user1: null,
        user2: null,
        match: null,
        messages: [],
        issues: [],
        recommendations: []
      };

      // Get user 1 data
      const user1Ref = doc(db, 'users', userId1);
      const user1Doc = await getDoc(user1Ref);
      if (user1Doc.exists()) {
        result.user1 = {
          id: userId1,
          ...user1Doc.data(),
          exists: true
        };
      } else {
        result.user1 = { id: userId1, exists: false };
        result.issues.push(`User ${userId1} does not exist`);
      }

      // Get user 2 data
      const user2Ref = doc(db, 'users', userId2);
      const user2Doc = await getDoc(user2Ref);
      if (user2Doc.exists()) {
        result.user2 = {
          id: userId2,
          ...user2Doc.data(),
          exists: true
        };
      } else {
        result.user2 = { id: userId2, exists: false };
        result.issues.push(`User ${userId2} does not exist`);
      }

      // Check if both users exist
      if (result.user1.exists && result.user2.exists) {
        // Find common match
        const user1Matches = result.user1.matches || [];
        const user2Matches = result.user2.matches || [];
        
        const commonMatch = user1Matches.find((matchId: string) => 
          user2Matches.includes(matchId)
        );

        if (commonMatch) {
          result.match = { id: commonMatch, found: true };
          
          // Get match document
          const matchRef = doc(db, 'matches', commonMatch);
          const matchDoc = await getDoc(matchRef);
          
          if (matchDoc.exists()) {
            result.match.data = matchDoc.data();
            
            // Check if both users are in the match
            const matchUsers = result.match.data.users || [];
            if (matchUsers.includes(userId1) && matchUsers.includes(userId2)) {
              result.match.bothUsersIncluded = true;
            } else {
              result.match.bothUsersIncluded = false;
              result.issues.push('Match document does not include both users');
            }
          } else {
            result.match.exists = false;
            result.issues.push('Match document does not exist');
          }
        } else {
          result.match = { found: false };
          result.issues.push('No common match found between users');
          result.recommendations.push('Users may not be matched yet');
        }

        // Get messages if match exists
        if (result.match && result.match.found && result.match.exists) {
          try {
            const messagesRef = collection(db, 'messages', commonMatch, 'messages');
            const messagesQuery = query(messagesRef);
            const messagesSnapshot = await getDocs(messagesQuery);
            
            result.messages = messagesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          } catch (error) {
            result.issues.push(`Error loading messages: ${error}`);
          }
        }
      }

      // Add recommendations
      if (result.issues.length === 0) {
        result.recommendations.push('Chat should work properly');
      } else {
        result.recommendations.push('Fix the issues above to enable chat');
      }

      setDebugResult(result);
    } catch (error) {
      console.error('Error debugging chat:', error);
      setDebugResult({
        error: error.message,
        issues: ['Debugging failed'],
        recommendations: ['Check console for details']
      });
    } finally {
      setLoading(false);
    }
  };

  const fixChat = async () => {
    if (!userId1.trim() || !userId2.trim()) return;
    
    setFixing(true);
    try {
      const result = await fixChatBetweenUsers(userId1, userId2);
      setFixResult(result);
      
      if (result.success) {
        // Re-run debug to see if the issue is fixed
        await debugChat();
      }
    } catch (error) {
      console.error('Error fixing chat:', error);
      setFixResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setFixing(false);
    }
  };

  const debugChatFromUserPerspective = async (fromUserId: string, toUserId: string) => {
    setLoading(true);
    try {
      const result: any = {
        fromUser: null,
        toUser: null,
        matchProcess: [],
        issues: [],
        recommendations: []
      };

      // Get from user data
      const fromUserRef = doc(db, 'users', fromUserId);
      const fromUserDoc = await getDoc(fromUserRef);
      if (fromUserDoc.exists()) {
        result.fromUser = {
          id: fromUserId,
          ...fromUserDoc.data(),
          exists: true
        };
      } else {
        result.fromUser = { id: fromUserId, exists: false };
        result.issues.push(`From user ${fromUserId} does not exist`);
        setDetailedDebug(result);
        return;
      }

      // Get to user data
      const toUserRef = doc(db, 'users', toUserId);
      const toUserDoc = await getDoc(toUserRef);
      if (toUserDoc.exists()) {
        result.toUser = {
          id: toUserId,
          ...toUserDoc.data(),
          exists: true
        };
      } else {
        result.toUser = { id: toUserId, exists: false };
        result.issues.push(`To user ${toUserId} does not exist`);
        setDetailedDebug(result);
        return;
      }

      // Simulate the ChatRoom match finding process
      const fromUserMatches = result.fromUser.matches || [];
      result.matchProcess.push(`From user has ${fromUserMatches.length} matches: ${fromUserMatches.join(', ')}`);

      let foundMatch = false;
      for (const matchId of fromUserMatches) {
        result.matchProcess.push(`Checking match ${matchId}...`);
        
        const matchRef = doc(db, 'matches', matchId);
        const matchDoc = await getDoc(matchRef);
        
        if (matchDoc.exists()) {
          const matchData = matchDoc.data();
          result.matchProcess.push(`Match ${matchId} exists with users: ${matchData.users?.join(', ')}`);
          
          if (matchData.users && matchData.users.includes(toUserId)) {
            result.matchProcess.push(`✅ Found match ${matchId} that includes both users`);
            foundMatch = true;
            result.matchId = matchId;
            result.matchData = matchData;
            break;
          } else {
            result.matchProcess.push(`❌ Match ${matchId} does not include target user ${toUserId}`);
          }
        } else {
          result.matchProcess.push(`❌ Match document ${matchId} does not exist`);
        }
      }

      if (!foundMatch) {
        result.issues.push('No match found that includes both users');
        result.recommendations.push('Users may not be properly matched');
      } else {
        result.recommendations.push('Chat should work - match found successfully');
      }

      setDetailedDebug(result);
    } catch (error) {
      console.error('Error in detailed debug:', error);
      setDetailedDebug({
        error: error.message,
        issues: ['Detailed debugging failed'],
        recommendations: ['Check console for details']
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Chat Debugger</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Debug Chat Between Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User 1 ID
                </label>
                <Input
                  value={userId1}
                  onChange={(e) => setUserId1(e.target.value)}
                  placeholder="Enter first user ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User 2 ID
                </label>
                <Input
                  value={userId2}
                  onChange={(e) => setUserId2(e.target.value)}
                  placeholder="Enter second user ID"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button
                  onClick={debugChat}
                  disabled={loading || !userId1.trim() || !userId2.trim()}
                  className="flex-1"
                >
                  {loading ? 'Debugging...' : 'Debug Chat'}
                </Button>
                
                <Button
                  onClick={fixChat}
                  disabled={fixing || !userId1.trim() || !userId2.trim()}
                  variant="outline"
                  className="flex-1"
                >
                  {fixing ? 'Fixing...' : 'Fix Chat'}
                </Button>
              </div>
              
              <div className="flex space-x-4">
                <Button
                  onClick={() => debugChatFromUserPerspective(userId1, userId2)}
                  disabled={loading || !userId1.trim() || !userId2.trim()}
                  variant="secondary"
                  className="flex-1"
                >
                  {loading ? 'Debugging...' : `Debug from ${userId1.slice(0, 8)}...`}
                </Button>
                
                <Button
                  onClick={() => debugChatFromUserPerspective(userId2, userId1)}
                  disabled={loading || !userId1.trim() || !userId2.trim()}
                  variant="secondary"
                  className="flex-1"
                >
                  {loading ? 'Debugging...' : `Debug from ${userId2.slice(0, 8)}...`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {debugResult && (
          <div className="space-y-6">
            {/* User 1 Info */}
            {debugResult.user1 && (
              <Card>
                <CardHeader>
                  <CardTitle>User 1: {userId1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div><strong>Exists:</strong> {debugResult.user1.exists ? '✅ Yes' : '❌ No'}</div>
                    {debugResult.user1.exists && (
                      <>
                        <div><strong>Name:</strong> {debugResult.user1.name}</div>
                        <div><strong>Matches:</strong> {debugResult.user1.matches?.length || 0}</div>
                        <div><strong>Match IDs:</strong> {debugResult.user1.matches?.join(', ') || 'None'}</div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User 2 Info */}
            {debugResult.user2 && (
              <Card>
                <CardHeader>
                  <CardTitle>User 2: {userId2}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div><strong>Exists:</strong> {debugResult.user2.exists ? '✅ Yes' : '❌ No'}</div>
                    {debugResult.user2.exists && (
                      <>
                        <div><strong>Name:</strong> {debugResult.user2.name}</div>
                        <div><strong>Matches:</strong> {debugResult.user2.matches?.length || 0}</div>
                        <div><strong>Match IDs:</strong> {debugResult.user2.matches?.join(', ') || 'None'}</div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Match Info */}
            {debugResult.match && (
              <Card>
                <CardHeader>
                  <CardTitle>Match Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div><strong>Found:</strong> {debugResult.match.found ? '✅ Yes' : '❌ No'}</div>
                    {debugResult.match.found && (
                      <>
                        <div><strong>Match ID:</strong> {debugResult.match.id}</div>
                        <div><strong>Match Exists:</strong> {debugResult.match.exists ? '✅ Yes' : '❌ No'}</div>
                        {debugResult.match.bothUsersIncluded !== undefined && (
                          <div><strong>Both Users Included:</strong> {debugResult.match.bothUsersIncluded ? '✅ Yes' : '❌ No'}</div>
                        )}
                        {debugResult.match.data && (
                          <div><strong>Match Users:</strong> {debugResult.match.data.users?.join(', ') || 'None'}</div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Messages Info */}
            {debugResult.messages && (
              <Card>
                <CardHeader>
                  <CardTitle>Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div><strong>Count:</strong> {debugResult.messages.length}</div>
                    {debugResult.messages.length > 0 && (
                      <div className="space-y-1">
                        {debugResult.messages.slice(0, 3).map((msg: any, index: number) => (
                          <div key={index} className="text-sm bg-gray-100 p-2 rounded">
                            <strong>{msg.senderId}:</strong> {msg.text}
                          </div>
                        ))}
                        {debugResult.messages.length > 3 && (
                          <div className="text-sm text-gray-500">... and {debugResult.messages.length - 3} more</div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Issues */}
            {debugResult.issues && debugResult.issues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Issues Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {debugResult.issues.map((issue: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Badge variant="destructive">❌</Badge>
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {debugResult.recommendations && debugResult.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {debugResult.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Badge variant="default">💡</Badge>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fix Result */}
            {fixResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Fix Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={fixResult.success ? "default" : "destructive"}>
                        {fixResult.success ? "✅" : "❌"}
                      </Badge>
                      <span className="font-semibold">
                        {fixResult.success ? 'Fix Successful' : 'Fix Failed'}
                      </span>
                    </div>
                    
                    {fixResult.message && (
                      <div className="text-sm text-gray-600">
                        {fixResult.message}
                      </div>
                    )}
                    
                    {fixResult.error && (
                      <div className="text-sm text-red-600">
                        Error: {fixResult.error}
                      </div>
                    )}
                    
                    {fixResult.matchId && (
                      <div className="text-sm text-gray-600">
                        Match ID: {fixResult.matchId}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Detailed Debug Results */}
        {detailedDebug && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Chat Process Debug</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* From User Info */}
                  {detailedDebug.fromUser && (
                    <div>
                      <h4 className="font-semibold">From User: {detailedDebug.fromUser.id}</h4>
                      <div className="text-sm text-gray-600">
                        <div>Name: {detailedDebug.fromUser.name}</div>
                        <div>Matches: {detailedDebug.fromUser.matches?.length || 0}</div>
                        <div>Match IDs: {detailedDebug.fromUser.matches?.join(', ') || 'None'}</div>
                      </div>
                    </div>
                  )}

                  {/* To User Info */}
                  {detailedDebug.toUser && (
                    <div>
                      <h4 className="font-semibold">To User: {detailedDebug.toUser.id}</h4>
                      <div className="text-sm text-gray-600">
                        <div>Name: {detailedDebug.toUser.name}</div>
                        <div>Matches: {detailedDebug.toUser.matches?.length || 0}</div>
                        <div>Match IDs: {detailedDebug.toUser.matches?.join(', ') || 'None'}</div>
                      </div>
                    </div>
                  )}

                  {/* Match Process */}
                  {detailedDebug.matchProcess && detailedDebug.matchProcess.length > 0 && (
                    <div>
                      <h4 className="font-semibold">Match Finding Process:</h4>
                      <div className="space-y-1">
                        {detailedDebug.matchProcess.map((step: string, index: number) => (
                          <div key={index} className="text-sm bg-gray-100 p-2 rounded">
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Issues */}
                  {detailedDebug.issues && detailedDebug.issues.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-600">Issues Found:</h4>
                      <div className="space-y-1">
                        {detailedDebug.issues.map((issue: string, index: number) => (
                          <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            ❌ {issue}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {detailedDebug.recommendations && detailedDebug.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-green-600">Recommendations:</h4>
                      <div className="space-y-1">
                        {detailedDebug.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="text-sm text-green-600 bg-green-50 p-2 rounded">
                            💡 {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDebugger;
