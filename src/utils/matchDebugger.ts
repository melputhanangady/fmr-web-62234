import { doc, getDoc, getDocs, collection, query, where, updateDoc, setDoc } from 'firebase/firestore';
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
