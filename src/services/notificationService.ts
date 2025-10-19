import { 
  doc, 
  getDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { isDemoMode } from '../utils/demoMode';

export interface NotificationData {
  newMatches: number;
  newLikes: number;
  totalNotifications: number;
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
    
    // For now, we'll use a simple approach:
    // - New matches: count of matches (could be enhanced with timestamps)
    // - New likes: count of users who liked this user but aren't matched yet
    let newLikes = 0;
    
    // Get all users who have liked this user
    const usersRef = collection(db, 'users');
    const likedByQuery = query(usersRef, where('likedUsers', 'array-contains', userId));
    const likedBySnapshot = await getDocs(likedByQuery);
    
    // Count users who liked this user but aren't in matches yet
    for (const likedByDoc of likedBySnapshot.docs) {
      const likedByData = likedByDoc.data();
      const likedByMatches = likedByData.matches || [];
      
      // Check if there's a match between this user and the one who liked them
      const hasMatch = matches.some((matchId: string) => 
        likedByMatches.includes(matchId)
      );
      
      if (!hasMatch) {
        newLikes++;
      }
    }

    return {
      newMatches: matches.length,
      newLikes,
      totalNotifications: matches.length + newLikes
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
