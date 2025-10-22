import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  getDoc,
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User, Match } from '../types';
import { rateLimiter } from '../utils/rateLimiter';
import { validateUserId } from '../utils/validation';

export const getPotentialMatches = async (currentUserId: string, userData: User): Promise<User[]> => {
  try {
    // Get all users except current user
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('__name__', '!=', currentUserId));
    const snapshot = await getDocs(q);
    
    const allUsers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];

    // Filter based on preferences and mutual compatibility
    const potentialMatches = allUsers.filter(user => {
      // Skip if already liked or passed
      if (userData.likedUsers.includes(user.id) || userData.passedUsers.includes(user.id)) {
        return false;
      }

      // Check age compatibility (both ways)
      const ageCompatible = 
        user.age >= userData.preferences.minAge && 
        user.age <= userData.preferences.maxAge &&
        userData.age >= user.preferences.minAge && 
        userData.age <= user.preferences.maxAge;

      if (!ageCompatible) return false;

      // Check gender preference (simplified - in real app you'd have gender field)
      const genderCompatible = 
        userData.preferences.interestedIn === 'both' ||
        user.preferences.interestedIn === 'both';

      if (!genderCompatible) return false;

      // Check city preference
      const cityCompatible = 
        userData.preferences.cities.length === 0 || 
        userData.preferences.cities.includes(user.city) ||
        user.preferences.cities.includes(userData.city);

      return cityCompatible;
    });

    return potentialMatches;
  } catch (error) {
    console.error('Error getting potential matches:', error);
    return [];
  }
};

export const likeUser = async (currentUserId: string, likedUserId: string): Promise<{ success: boolean; isMatch: boolean; error?: string; alreadyMatched?: boolean }> => {
  try {
    console.log('likeUser called:', { currentUserId, likedUserId });
    
    // Validate user IDs
    if (!validateUserId(currentUserId) || !validateUserId(likedUserId)) {
      throw new Error('Invalid user ID');
    }

    // Rate limiting check
    const rateLimitResult = rateLimiter.isAllowed(currentUserId, 'like');
    if (!rateLimitResult.allowed) {
      throw new Error('Rate limit exceeded. Please wait before liking again.');
    }

    // Check if users are already matched
    const currentUserRef = doc(db, 'users', currentUserId);
    const currentUserDoc = await getDoc(currentUserRef);
    
    if (currentUserDoc.exists()) {
      const currentUserData = currentUserDoc.data() as User;
      const currentUserMatches = currentUserData.matches || [];
      
      // Check if there's already a match between these users
      const likedUserRef = doc(db, 'users', likedUserId);
      const likedUserDoc = await getDoc(likedUserRef);
      
      if (likedUserDoc.exists()) {
        const likedUserData = likedUserDoc.data() as User;
        const likedUserMatches = likedUserData.matches || [];
        
        // Check if they share any match IDs
        const hasSharedMatches = currentUserMatches.some(matchId => likedUserMatches.includes(matchId));
        
        if (hasSharedMatches) {
          console.log('Users are already matched!');
          return {
            success: false,
            isMatch: false,
            alreadyMatched: true,
            error: `You are already matched with ${likedUserData.name}!`
          };
        }
      }
    }

    // Add to current user's liked list
    console.log('Attempting to update user document:', { currentUserId, likedUserId });
    
    try {
      await updateDoc(currentUserRef, {
        likedUsers: arrayUnion(likedUserId)
      });
      console.log('Successfully added to current user\'s liked list');
    } catch (updateError) {
      console.error('Error updating user document:', updateError);
      throw updateError;
    }

    // Check if it's a mutual like
    const likedUserRef = doc(db, 'users', likedUserId);
    const likedUserDoc = await getDoc(likedUserRef);
    
    if (likedUserDoc.exists()) {
      const likedUserData = likedUserDoc.data() as User;
      
      if (likedUserData.likedUsers.includes(currentUserId)) {
        console.log('Mutual like detected! Creating match...');
        // It's a match! Create match document
        const matchId = await createMatch(currentUserId, likedUserId);
        console.log('Match created with ID:', matchId);
        return { success: true, isMatch: true }; // Return success with match indication
      } else {
        console.log('No mutual like yet');
      }
    } else {
      console.log('Liked user document not found');
    }

    return { success: true, isMatch: false }; // Successfully liked but no match yet
  } catch (error) {
    console.error('Error liking user:', error);
    return { success: false, isMatch: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const passUser = async (currentUserId: string, passedUserId: string): Promise<void> => {
  try {
    // Validate user IDs
    if (!validateUserId(currentUserId) || !validateUserId(passedUserId)) {
      throw new Error('Invalid user ID');
    }

    // Rate limiting check
    const rateLimitResult = rateLimiter.isAllowed(currentUserId, 'pass');
    if (!rateLimitResult.allowed) {
      throw new Error('Rate limit exceeded. Please wait before passing again.');
    }

    const currentUserRef = doc(db, 'users', currentUserId);
    await updateDoc(currentUserRef, {
      passedUsers: arrayUnion(passedUserId)
    });
  } catch (error) {
    console.error('Error passing user:', error);
    throw error;
  }
};

export const createMatch = async (userId1: string, userId2: string): Promise<string> => {
  try {
    console.log('Creating match between:', { userId1, userId2 });
    
    const matchRef = await addDoc(collection(db, 'matches'), {
      users: [userId1, userId2],
      createdAt: new Date()
    });
    console.log('Match document created with ID:', matchRef.id);

    // Add match to both users' matches array
    const user1Ref = doc(db, 'users', userId1);
    const user2Ref = doc(db, 'users', userId2);
    
    try {
      await updateDoc(user1Ref, {
        matches: arrayUnion(matchRef.id)
      });
      console.log('Successfully added match to user1 matches');
    } catch (error) {
      console.error('Error adding match to user1:', error);
      throw error;
    }
    
    try {
      await updateDoc(user2Ref, {
        matches: arrayUnion(matchRef.id)
      });
      console.log('Successfully added match to user2 matches');
    } catch (error) {
      console.error('Error adding match to user2:', error);
      throw error;
    }

    return matchRef.id;
  } catch (error) {
    console.error('Error creating match:', error);
    throw error;
  }
};

export const getMatches = async (userId: string): Promise<Match[]> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data() as User;
    const matchIds = userData.matches;

    if (matchIds.length === 0) {
      return [];
    }

    // Get match documents
    const matches: Match[] = [];
    for (const matchId of matchIds) {
      const matchRef = doc(db, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);
      
      if (matchDoc.exists()) {
        matches.push({
          id: matchDoc.id,
          ...matchDoc.data()
        } as Match);
      }
    }

    return matches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting matches:', error);
    return [];
  }
};
