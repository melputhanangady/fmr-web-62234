import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ChatFixResult {
  success: boolean;
  error?: string;
  matchId?: string;
  message?: string;
}

/**
 * Fix missing match document for chat functionality
 */
export const fixMissingMatchDocument = async (
  matchId: string, 
  userId1: string, 
  userId2: string
): Promise<ChatFixResult> => {
  try {
    console.log(`Fixing missing match document: ${matchId}`);
    console.log(`Users: ${userId1}, ${userId2}`);

    // Check if match document already exists
    const matchRef = doc(db, 'matches', matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (matchDoc.exists()) {
      return {
        success: true,
        matchId,
        message: 'Match document already exists'
      };
    }

    // Create the missing match document
    const matchData = {
      users: [userId1, userId2],
      createdAt: new Date(),
      lastActivity: new Date()
    };

    await setDoc(matchRef, matchData);
    
    console.log(`Match document created successfully: ${matchId}`);
    
    return {
      success: true,
      matchId,
      message: 'Match document created successfully'
    };
  } catch (error) {
    console.error('Error fixing missing match document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Fix chat between two specific users
 */
export const fixChatBetweenUsers = async (
  userId1: string, 
  userId2: string
): Promise<ChatFixResult> => {
  try {
    console.log(`Fixing chat between users: ${userId1}, ${userId2}`);

    // Get user 1 data to find common match
    const user1Ref = doc(db, 'users', userId1);
    const user1Doc = await getDoc(user1Ref);
    
    if (!user1Doc.exists()) {
      return {
        success: false,
        error: `User ${userId1} does not exist`
      };
    }

    const user1Data = user1Doc.data();
    const user1Matches = user1Data.matches || [];

    // Get user 2 data to find common match
    const user2Ref = doc(db, 'users', userId2);
    const user2Doc = await getDoc(user2Ref);
    
    if (!user2Doc.exists()) {
      return {
        success: false,
        error: `User ${userId2} does not exist`
      };
    }

    const user2Data = user2Doc.data();
    const user2Matches = user2Data.matches || [];

    // Find common match
    const commonMatch = user1Matches.find((matchId: string) => 
      user2Matches.includes(matchId)
    );

    if (!commonMatch) {
      return {
        success: false,
        error: 'No common match found between users'
      };
    }

    // Fix the missing match document
    return await fixMissingMatchDocument(commonMatch, userId1, userId2);
  } catch (error) {
    console.error('Error fixing chat between users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
