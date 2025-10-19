import { 
  doc, 
  getDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { isDemoMode } from '../utils/demoMode';

export interface NotificationData {
  newMatches: number;
  newLikes: number;
  totalNotifications: number;
  seenMatches: string[];
  seenLikes: string[];
}

export interface NotificationListener {
  unsubscribe: () => void;
}

/**
 * Get notification counts for a user
 */
export const getNotificationCounts = async (userId: string): Promise<NotificationData> => {
  try {
    if (isDemoMode()) {
      // In demo mode, return mock data
      return {
        newMatches: 0,
        newLikes: 0,
        totalNotifications: 0
      };
    }

    // Get user document to check for new matches and likes
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return {
        newMatches: 0,
        newLikes: 0,
        totalNotifications: 0
      };
    }

    const userData = userDoc.data();
    const matches = userData.matches || [];
    const likedUsers = userData.likedUsers || [];
    const seenMatches = userData.seenMatches || [];
    const seenLikes = userData.seenLikes || [];
    
    // Calculate new matches (matches that haven't been seen)
    const newMatches = matches.filter((matchId: string) => !seenMatches.includes(matchId));
    
    // Calculate new likes (users who liked this user but aren't matched yet and haven't been seen)
    let newLikes = 0;
    
    // Get all users who have liked this user
    const usersRef = collection(db, 'users');
    const likedByQuery = query(usersRef, where('likedUsers', 'array-contains', userId));
    const likedBySnapshot = await getDocs(likedByQuery);
    
    // Count users who liked this user but aren't in matches yet and haven't been seen
    for (const likedByDoc of likedBySnapshot.docs) {
      const likedByData = likedByDoc.data();
      const likedByMatches = likedByData.matches || [];
      const likedByUserId = likedByDoc.id;
      
      // Check if there's a match between this user and the one who liked them
      const hasMatch = matches.some((matchId: string) => 
        likedByMatches.includes(matchId)
      );
      
      // Check if this like has been seen
      const hasBeenSeen = seenLikes.includes(likedByUserId);
      
      if (!hasMatch && !hasBeenSeen) {
        newLikes++;
      }
    }

    return {
      newMatches: newMatches.length,
      newLikes,
      totalNotifications: newMatches.length + newLikes,
      seenMatches,
      seenLikes
    };
    
  } catch (error) {
    console.error('Error getting notification counts:', error);
    return {
      newMatches: 0,
      newLikes: 0,
      totalNotifications: 0
    };
  }
};

/**
 * Set up real-time listener for notifications
 */
export const subscribeToNotifications = (
  userId: string, 
  callback: (notifications: NotificationData) => void
): NotificationListener => {
  if (isDemoMode()) {
    // In demo mode, return a no-op listener
    return {
      unsubscribe: () => {}
    };
  }

  // Listen to user document changes
  const userRef = doc(db, 'users', userId);
  const unsubscribe = onSnapshot(userRef, async (userDoc) => {
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const matches = userData.matches || [];
      const likedUsers = userData.likedUsers || [];
      
      // Get new likes count
      let newLikes = 0;
      try {
        const usersRef = collection(db, 'users');
        const likedByQuery = query(usersRef, where('likedUsers', 'array-contains', userId));
        const likedBySnapshot = await getDocs(likedByQuery);
        
        for (const likedByDoc of likedBySnapshot.docs) {
          const likedByData = likedByDoc.data();
          const likedByMatches = likedByData.matches || [];
          
          const hasMatch = matches.some((matchId: string) => 
            likedByMatches.includes(matchId)
          );
          
          if (!hasMatch) {
            newLikes++;
          }
        }
      } catch (error) {
        console.error('Error calculating new likes:', error);
      }

      const notifications: NotificationData = {
        newMatches: matches.length,
        newLikes,
        totalNotifications: matches.length + newLikes
      };

      callback(notifications);
    } else {
      callback({
        newMatches: 0,
        newLikes: 0,
        totalNotifications: 0
      });
    }
  });

  return { unsubscribe };
};

/**
 * Get recent activity for notifications
 */
export const getRecentActivity = async (userId: string) => {
  try {
    if (isDemoMode()) {
      return [];
    }

    // Get user's matches and check for recent activity
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data();
    const matches = userData.matches || [];
    
    const activities = [];
    
    // Check for new matches
    for (const matchId of matches) {
      try {
        const matchRef = doc(db, 'matches', matchId);
        const matchDoc = await getDoc(matchRef);
        
        if (matchDoc.exists()) {
          const matchData = matchDoc.data();
          const otherUserId = matchData.users?.find((id: string) => id !== userId);
          
          if (otherUserId) {
            // Get other user's info
            const otherUserRef = doc(db, 'users', otherUserId);
            const otherUserDoc = await getDoc(otherUserRef);
            
            if (otherUserDoc.exists()) {
              const otherUserData = otherUserDoc.data();
              activities.push({
                type: 'match',
                userId: otherUserId,
                userName: otherUserData.name,
                timestamp: matchData.createdAt
              });
            }
          }
        }
      } catch (error) {
        console.error('Error getting match activity:', error);
      }
    }
    
    return activities.sort((a, b) => b.timestamp - a.timestamp);
    
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
};

/**
 * Mark matches as seen
 */
export const markMatchesAsSeen = async (userId: string, matchIds: string[]): Promise<boolean> => {
  try {
    if (isDemoMode()) {
      return true;
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      seenMatches: arrayUnion(...matchIds)
    });

    return true;
  } catch (error) {
    console.error('Error marking matches as seen:', error);
    return false;
  }
};

/**
 * Mark likes as seen
 */
export const markLikesAsSeen = async (userId: string, likeUserIds: string[]): Promise<boolean> => {
  try {
    if (isDemoMode()) {
      return true;
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      seenLikes: arrayUnion(...likeUserIds)
    });

    return true;
  } catch (error) {
    console.error('Error marking likes as seen:', error);
    return false;
  }
};

/**
 * Mark all notifications as seen
 */
export const markAllNotificationsAsSeen = async (userId: string): Promise<boolean> => {
  try {
    if (isDemoMode()) {
      return true;
    }

    // Get current user data to get all matches and likes
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();
    const matches = userData.matches || [];
    const seenMatches = userData.seenMatches || [];
    const seenLikes = userData.seenLikes || [];

    // Get all users who have liked this user
    const usersRef = collection(db, 'users');
    const likedByQuery = query(usersRef, where('likedUsers', 'array-contains', userId));
    const likedBySnapshot = await getDocs(likedByQuery);
    
    const allLikeUserIds: string[] = [];
    for (const likedByDoc of likedBySnapshot.docs) {
      const likedByData = likedByDoc.data();
      const likedByMatches = likedByData.matches || [];
      const likedByUserId = likedByDoc.id;
      
      // Check if there's a match between this user and the one who liked them
      const hasMatch = matches.some((matchId: string) => 
        likedByMatches.includes(matchId)
      );
      
      if (!hasMatch) {
        allLikeUserIds.push(likedByUserId);
      }
    }

    // Mark all unseen matches as seen
    const unseenMatches = matches.filter((matchId: string) => !seenMatches.includes(matchId));
    
    // Mark all unseen likes as seen
    const unseenLikes = allLikeUserIds.filter((likeUserId: string) => !seenLikes.includes(likeUserId));

    // Update the user document
    const updates: any = {};
    if (unseenMatches.length > 0) {
      updates.seenMatches = arrayUnion(...unseenMatches);
    }
    if (unseenLikes.length > 0) {
      updates.seenLikes = arrayUnion(...unseenLikes);
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, updates);
    }

    return true;
  } catch (error) {
    console.error('Error marking all notifications as seen:', error);
    return false;
  }
};
