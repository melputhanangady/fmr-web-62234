import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  getDoc,
  getDocs,
  where,
  limit,
  startAfter,
  DocumentSnapshot,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Message, ChatUser } from '../types';
import { validateMessage } from '../utils/validation';
import { InputSanitizer } from '../utils/sanitizer';
import { rateLimiter } from '../utils/rateLimiter';

export const sendMessage = async (matchId: string, senderId: string, text: string): Promise<void> => {
  try {
    // Rate limiting check
    const rateLimitResult = rateLimiter.isAllowed(senderId, 'message');
    if (!rateLimitResult.allowed) {
      throw new Error('Rate limit exceeded. Please wait before sending another message.');
    }

    // Sanitize and validate message
    const sanitizedText = InputSanitizer.sanitizeText(text);
    const validationResult = validateMessage(sanitizedText);
    
    if (!validationResult.isValid) {
      throw new Error(`Invalid message: ${validationResult.errors.join(', ')}`);
    }

    await addDoc(collection(db, 'messages', matchId, 'messages'), {
      senderId,
      text: sanitizedText,
      timestamp: new Date(),
      read: false
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const subscribeToMessages = (
  matchId: string, 
  callback: (messages: Message[]) => void
): (() => void) => {
  const messagesRef = collection(db, 'messages', matchId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    })) as Message[];
    
    callback(messages);
  });
};

export const getMatchesWithUsers = async (userId: string): Promise<ChatUser[]> => {
  try {
    // Get user's matches
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data();
    const matchIds = userData.matches || [];

    if (matchIds.length === 0) {
      return [];
    }

    // Get match documents to find other users
    const matches: ChatUser[] = [];
    
    for (const matchId of matchIds) {
      const matchRef = doc(db, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);
      
      if (matchDoc.exists()) {
        const matchData = matchDoc.data();
        const otherUserId = matchData.users.find((id: string) => id !== userId);
        
        if (otherUserId) {
          // Get other user's profile
          const otherUserRef = doc(db, 'users', otherUserId);
          const otherUserDoc = await getDoc(otherUserRef);
          
          if (otherUserDoc.exists()) {
            const otherUserData = otherUserDoc.data();
            
            // Get last message
            const messagesRef = collection(db, 'messages', matchId, 'messages');
            const lastMessageQuery = query(
              messagesRef, 
              orderBy('timestamp', 'desc'), 
              limit(1)
            );
            const lastMessageSnapshot = await getDocs(lastMessageQuery);
            
            let lastMessage = '';
            let lastMessageTime: Date | undefined;
            let unreadCount = 0;

            if (!lastMessageSnapshot.empty) {
              const lastMessageDoc = lastMessageSnapshot.docs[0];
              const lastMessageData = lastMessageDoc.data();
              lastMessage = lastMessageData.text;
              lastMessageTime = lastMessageData.timestamp.toDate();
              
              // Count unread messages (messages not sent by current user)
              // Get all messages and filter in application to avoid composite index requirement
              const allMessagesQuery = query(messagesRef);
              const allMessagesSnapshot = await getDocs(allMessagesQuery);
              unreadCount = allMessagesSnapshot.docs.filter(doc => {
                const data = doc.data();
                return data.senderId !== userId && data.read === false;
              }).length;
            }

            matches.push({
              id: otherUserId,
              name: otherUserData.name,
              photos: otherUserData.photos || [],
              lastMessage,
              lastMessageTime,
              unreadCount
            });
          }
        }
      }
    }

    // Remove duplicates based on user ID
    const uniqueMatches = matches.filter((match, index, self) => 
      index === self.findIndex(m => m.id === match.id)
    );

    // Sort by last message time
    return uniqueMatches.sort((a, b) => {
      if (!a.lastMessageTime && !b.lastMessageTime) return 0;
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
    });
  } catch (error) {
    console.error('Error getting matches with users:', error);
    return [];
  }
};

export const markMessagesAsRead = async (matchId: string, userId: string): Promise<void> => {
  try {
    const messagesRef = collection(db, 'messages', matchId, 'messages');
    // Get all messages and filter in application to avoid composite index requirement
    const allMessagesQuery = query(messagesRef);
    const snapshot = await getDocs(allMessagesQuery);
    
    const unreadMessages = snapshot.docs.filter(doc => {
      const data = doc.data();
      return data.senderId !== userId && data.read === false;
    });
    
    const batch = [];
    unreadMessages.forEach(doc => {
      batch.push(updateDoc(doc.ref, { read: true }));
    });
    
    await Promise.all(batch);
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};
