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

export const likeUser = async (currentUserId: string, likedUserId: string): Promise<boolean> => {
  try {
    // Validate user IDs
    if (!validateUserId(currentUserId) || !validateUserId(likedUserId)) {
      throw new Error('Invalid user ID');
    }

    // Rate limiting check
    const rateLimitResult = rateLimiter.isAllowed(currentUserId, 'like');
    if (!rateLimitResult.allowed) {
      throw new Error('Rate limit exceeded. Please wait before liking again.');
    }

    // Add to current user's liked list
    const currentUserRef = doc(db, 'users', currentUserId);
    await updateDoc(currentUserRef, {
      likedUsers: arrayUnion(likedUserId)
    });

    // Check if it's a mutual like
    const likedUserRef = doc(db, 'users', likedUserId);
    const likedUserDoc = await getDoc(likedUserRef);
    
    if (likedUserDoc.exists()) {
      const likedUserData = likedUserDoc.data() as User;
      
      if (likedUserData.likedUsers.includes(currentUserId)) {
        // It's a match! Create match document
        await createMatch(currentUserId, likedUserId);
        return true; // Return true to indicate a match
      }
    }

    return false; // No match yet
  } catch (error) {
    console.error('Error liking user:', error);
    throw error;
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
    const matchRef = await addDoc(collection(db, 'matches'), {
      users: [userId1, userId2],
      createdAt: new Date()
    });

    // Add match to both users' matches array
    const user1Ref = doc(db, 'users', userId1);
    const user2Ref = doc(db, 'users', userId2);
    
    await updateDoc(user1Ref, {
      matches: arrayUnion(matchRef.id)
    });
    
    await updateDoc(user2Ref, {
      matches: arrayUnion(matchRef.id)
    });

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
