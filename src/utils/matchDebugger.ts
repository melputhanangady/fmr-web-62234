import { doc, getDoc, getDocs, collection, query, where, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User, Match } from '../types';

export interface MatchDebugResult {
  userId: string;
  userExists: boolean;
  userData?: any;
  matchIds: string[];
  validMatches: string[];
  invalidMatches: string[];
  orphanedMatches: string[];
  otherUsers: {
    userId: string;
    exists: boolean;
    hasMatch: boolean;
  }[];
  issues: string[];
  recommendations: string[];
}

export const debugUserMatches = async (userId: string): Promise<MatchDebugResult> => {
  const result: MatchDebugResult = {
    userId,
    userExists: false,
    matchIds: [],
    validMatches: [],
    invalidMatches: [],
    orphanedMatches: [],
    otherUsers: [],
    issues: [],
    recommendations: []
  };

  try {
    // 1. Check if user document exists
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      result.issues.push('User document does not exist');
      result.recommendations.push('Create user document or check user ID');
      return result;
    }
    
    result.userExists = true;
    result.userData = userDoc.data();
    result.matchIds = result.userData.matches || [];
    
    if (result.matchIds.length === 0) {
      result.issues.push('User has no matches in their matches array');
      result.recommendations.push('Check if matches were created properly');
    }

    // 2. Check each match document
    for (const matchId of result.matchIds) {
      const matchRef = doc(db, 'matches', matchId);
      
      try {
        const matchDoc = await getDoc(matchRef);
        
        if (!matchDoc.exists()) {
          result.invalidMatches.push(matchId);
          result.issues.push(`Match document ${matchId} does not exist`);
          continue;
        }
        
        const matchData = matchDoc.data();
        const otherUserId = matchData.users?.find((id: string) => id !== userId);
        
        if (!otherUserId) {
          result.invalidMatches.push(matchId);
          result.issues.push(`Match ${matchId} has no other user`);
          continue;
        }
      } catch (error: any) {
        result.invalidMatches.push(matchId);
        if (error.code === 'permission-denied') {
          result.issues.push(`Permission denied accessing match ${matchId} - user may not be in match users array`);
        } else {
          result.issues.push(`Error accessing match ${matchId}: ${error.message}`);
        }
        continue;
      }
      
      // Check if other user exists and has this match
      const otherUserRef = doc(db, 'users', otherUserId);
      const otherUserDoc = await getDoc(otherUserRef);
      
      result.otherUsers.push({
        userId: otherUserId,
        exists: otherUserDoc.exists(),
        hasMatch: otherUserDoc.exists() && (otherUserDoc.data()?.matches || []).includes(matchId)
      });
      
      if (!otherUserDoc.exists()) {
        result.invalidMatches.push(matchId);
        result.issues.push(`Other user ${otherUserId} does not exist`);
        continue;
      }
      
      if (!result.otherUsers[result.otherUsers.length - 1].hasMatch) {
        result.issues.push(`Other user ${otherUserId} does not have match ${matchId} in their matches array`);
      }
      
      result.validMatches.push(matchId);
    }

    // 3. Check for orphaned matches
    const matchesRef = collection(db, 'matches');
    const userMatchesQuery = query(matchesRef, where('users', 'array-contains', userId));
    const allUserMatchesSnapshot = await getDocs(userMatchesQuery);
    
    const allMatchIds = allUserMatchesSnapshot.docs.map(doc => doc.id);
    result.orphanedMatches = allMatchIds.filter(id => !result.matchIds.includes(id));
    
    if (result.orphanedMatches.length > 0) {
      result.issues.push(`Found ${result.orphanedMatches.length} orphaned matches`);
      result.recommendations.push('Rebuild user matches array to include orphaned matches');
    }

    // 4. Generate recommendations
    if (result.invalidMatches.length > 0) {
      result.recommendations.push('Remove invalid match IDs from user document');
    }
    
    if (result.orphanedMatches.length > 0) {
      result.recommendations.push('Add orphaned matches to user document');
    }
    
    if (result.issues.length === 0) {
      result.recommendations.push('No issues found - matches should be working correctly');
    }

    return result;
  } catch (error) {
    result.issues.push(`Error during debugging: ${error}`);
    return result;
  }
};

export const fixUserMatches = async (userId: string): Promise<boolean> => {
  try {
    const debugResult = await debugUserMatches(userId);
    
    if (debugResult.issues.length === 0) {
      console.log('No issues found - no fixes needed');
      return true;
    }
    
    // Fix orphaned matches
    if (debugResult.orphanedMatches.length > 0) {
      const userRef = doc(db, 'users', userId);
      const allMatchIds = [...debugResult.matchIds, ...debugResult.orphanedMatches];
      await updateDoc(userRef, { matches: allMatchIds });
      console.log('Added orphaned matches to user document');
    }
    
    // Remove invalid matches
    if (debugResult.invalidMatches.length > 0) {
      const userRef = doc(db, 'users', userId);
      const validMatchIds = debugResult.matchIds.filter(id => !debugResult.invalidMatches.includes(id));
      await updateDoc(userRef, { matches: validMatchIds });
      console.log('Removed invalid matches from user document');
    }
    
    return true;
  } catch (error) {
    console.error('Error fixing user matches:', error);
    return false;
  }
};

export const rebuildUserMatches = async (userId: string): Promise<string[]> => {
  try {
    // Get all matches where user is a participant
    const matchesRef = collection(db, 'matches');
    const userMatchesQuery = query(matchesRef, where('users', 'array-contains', userId));
    const userMatchesSnapshot = await getDocs(userMatchesQuery);
    
    const matchIds = userMatchesSnapshot.docs.map(doc => doc.id);
    
    // Update user document with all valid matches
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { matches: matchIds });
    
    console.log(`Rebuilt matches for user ${userId}: ${matchIds.length} matches`);
    return matchIds;
  } catch (error) {
    console.error('Error rebuilding user matches:', error);
    return [];
  }
};

/**
 * Check if a user is properly included in a match document
 */
export async function checkUserInMatch(userId: string, matchId: string): Promise<{
  success: boolean;
  error?: string;
  matchData?: any;
  userInMatch?: boolean;
}> {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) {
      return {
        success: false,
        error: 'Match document does not exist'
      };
    }
    
    const matchData = matchDoc.data();
    const userInMatch = matchData.users?.includes(userId) || false;
    
    return {
      success: true,
      matchData,
      userInMatch
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Fix a user not being in a match document's users array
 */
export async function fixUserInMatch(userId: string, matchId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) {
      return {
        success: false,
        error: 'Match document does not exist'
      };
    }
    
    const matchData = matchDoc.data();
    const currentUsers = matchData.users || [];
    
    if (!currentUsers.includes(userId)) {
      await updateDoc(matchRef, {
        users: arrayUnion(userId)
      });
    }
    
    return {
      success: true
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Debug mutual matching between two specific users
 */
export async function debugMutualMatching(userId1: string, userId2: string): Promise<{
  success: boolean;
  error?: string;
  user1Data?: any;
  user2Data?: any;
  mutualLike?: boolean;
  matchExists?: boolean;
  matchId?: string;
  issues?: string[];
  recommendations?: string[];
}> {
  try {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Get both user documents
    const user1Ref = doc(db, 'users', userId1);
    const user2Ref = doc(db, 'users', userId2);
    
    const [user1Doc, user2Doc] = await Promise.all([
      getDoc(user1Ref),
      getDoc(user2Ref)
    ]);
    
    if (!user1Doc.exists()) {
      issues.push(`User ${userId1} document does not exist`);
      return { success: false, error: `User ${userId1} not found`, issues, recommendations };
    }
    
    if (!user2Doc.exists()) {
      issues.push(`User ${userId2} document does not exist`);
      return { success: false, error: `User ${userId2} not found`, issues, recommendations };
    }
    
    const user1Data = user1Doc.data();
    const user2Data = user2Doc.data();
    
    // Check if they liked each other
    const user1LikedUser2 = user1Data.likedUsers?.includes(userId2) || false;
    const user2LikedUser1 = user2Data.likedUsers?.includes(userId1) || false;
    const mutualLike = user1LikedUser2 && user2LikedUser1;
    
    if (!user1LikedUser2) {
      issues.push(`User ${userId1} has not liked ${userId2}`);
    }
    
    if (!user2LikedUser1) {
      issues.push(`User ${userId2} has not liked ${userId1}`);
    }
    
    if (!mutualLike) {
      recommendations.push('Both users need to like each other for a match to be created');
      return {
        success: true,
        user1Data,
        user2Data,
        mutualLike: false,
        issues,
        recommendations
      };
    }
    
    // Check if match exists
    const user1Matches = user1Data.matches || [];
    const user2Matches = user2Data.matches || [];
    
    // Find common match ID
    const commonMatchId = user1Matches.find((matchId: string) => user2Matches.includes(matchId));
    
    if (!commonMatchId) {
      issues.push('No common match ID found between users');
      recommendations.push('Match document may not have been created or added to both users');
      
      // Check if there are any matches that should contain both users
      for (const matchId of user1Matches) {
        try {
          const matchRef = doc(db, 'matches', matchId);
          const matchDoc = await getDoc(matchRef);
          
          if (matchDoc.exists()) {
            const matchData = matchDoc.data();
            if (matchData.users?.includes(userId2)) {
              issues.push(`Match ${matchId} contains both users but is not in user2's matches array`);
              recommendations.push(`Add match ${matchId} to user ${userId2}'s matches array`);
            }
          }
        } catch (error) {
          issues.push(`Error checking match ${matchId}: ${error}`);
        }
      }
      
      for (const matchId of user2Matches) {
        try {
          const matchRef = doc(db, 'matches', matchId);
          const matchDoc = await getDoc(matchRef);
          
          if (matchDoc.exists()) {
            const matchData = matchDoc.data();
            if (matchData.users?.includes(userId1)) {
              issues.push(`Match ${matchId} contains both users but is not in user1's matches array`);
              recommendations.push(`Add match ${matchId} to user ${userId1}'s matches array`);
            }
          }
        } catch (error) {
          issues.push(`Error checking match ${matchId}: ${error}`);
        }
      }
      
      return {
        success: true,
        user1Data,
        user2Data,
        mutualLike: true,
        matchExists: false,
        issues,
        recommendations
      };
    }
    
    // Verify the match document exists and contains both users
    const matchRef = doc(db, 'matches', commonMatchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) {
      issues.push(`Match document ${commonMatchId} does not exist`);
      recommendations.push('Remove invalid match ID from both users and recreate match');
      return {
        success: true,
        user1Data,
        user2Data,
        mutualLike: true,
        matchExists: false,
        matchId: commonMatchId,
        issues,
        recommendations
      };
    }
    
    const matchData = matchDoc.data();
    const bothUsersInMatch = matchData.users?.includes(userId1) && matchData.users?.includes(userId2);
    
    if (!bothUsersInMatch) {
      issues.push(`Match document ${commonMatchId} does not contain both users`);
      recommendations.push('Update match document to include both users');
    }
    
    return {
      success: true,
      user1Data,
      user2Data,
      mutualLike: true,
      matchExists: true,
      matchId: commonMatchId,
      issues,
      recommendations
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Fix missing matches for a specific user by finding all matches they should be part of
 */
export async function fixMissingMatchesForUser(userId: string): Promise<{
  success: boolean;
  error?: string;
  matchesFound?: number;
  matchesAdded?: string[];
}> {
  try {
    const matchesAdded: string[] = [];
    
    // Get all matches where this user is in the users array
    const matchesRef = collection(db, 'matches');
    const matchesQuery = query(matchesRef, where('users', 'array-contains', userId));
    const matchesSnapshot = await getDocs(matchesQuery);
    
    console.log(`Found ${matchesSnapshot.docs.length} matches containing user ${userId}`);
    
    // Get user's current matches
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return {
        success: false,
        error: 'User document does not exist'
      };
    }
    
    const userData = userDoc.data();
    const currentMatches = userData.matches || [];
    
    // Find matches that should be in user's array but aren't
    for (const matchDoc of matchesSnapshot.docs) {
      const matchId = matchDoc.id;
      const matchData = matchDoc.data();
      
      if (!currentMatches.includes(matchId)) {
        console.log(`Adding missing match ${matchId} to user ${userId}`);
        
        // Add match to user's matches array
        await updateDoc(userRef, {
          matches: arrayUnion(matchId)
        });
        
        matchesAdded.push(matchId);
      }
    }
    
    return {
      success: true,
      matchesFound: matchesSnapshot.docs.length,
      matchesAdded
    };
    
  } catch (error: any) {
    console.error('Error fixing missing matches:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
