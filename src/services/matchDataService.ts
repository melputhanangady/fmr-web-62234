import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { isDemoMode } from '../utils/demoMode';

export interface MatchDataProfile {
  userId: string;
  name: string;
  age: number;
  bio: string;
  city: string;
  interests: string[];
  hobbies?: string[];
  education?: string;
  occupation?: string;
  height?: string;
  relationshipStatus?: string;
  lookingFor?: string;
  lifestyle?: string[];
  personality?: string[];
  dealBreakers?: string[];
  funFacts?: string[];
  photos: string[];
  // Questionnaire responses (to be added later)
  questionnaireResponses?: Record<string, any>;
}

export interface MatchDataRecord {
  id: string;
  user1Profile: MatchDataProfile;
  user2Profile: MatchDataProfile;
  matchDate: Date;
  isActive: boolean; // Whether the match is still active
  relationshipStatus: 'dating' | 'married' | 'engaged' | 'separated' | 'other';
  satisfactionScore?: number; // 1-10 scale
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchDataCollection {
  totalMatches: number;
  activeMatches: number;
  averageSatisfaction: number;
  lastUpdated: Date;
}

/**
 * Get all successful matches for data collection
 */
export const getSuccessfulMatches = async (): Promise<any[]> => {
  try {
    if (isDemoMode()) {
      return [];
    }

    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const successfulMatches: any[] = [];
    const processedPairs = new Set<string>();
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const userId = doc.id;
      const userMatches = userData.matches || [];
      
      // For each match, find the other user and create match data
      userMatches.forEach((matchId: string) => {
        // Create a unique pair identifier to avoid duplicates
        const pairKey = [userId, matchId].sort().join('-');
        
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          
          // Find the other user in the match
          usersSnapshot.forEach((otherDoc) => {
            if (otherDoc.id === matchId) {
              const otherUserData = otherDoc.data();
              const otherUserMatches = otherUserData.matches || [];
              
              // Verify this is a mutual match
              if (otherUserMatches.includes(userId)) {
                successfulMatches.push({
                  user1Id: userId,
                  user1Data: userData,
                  user2Id: matchId,
                  user2Data: otherUserData,
                  matchId: matchId
                });
              }
            }
          });
        }
      });
    });
    
    return successfulMatches;
  } catch (error) {
    console.error('Error fetching successful matches:', error);
    return [];
  }
};

/**
 * Store match data in the matchData collection
 */
export const storeMatchData = async (
  user1Id: string, 
  user2Id: string, 
  user1Profile: MatchDataProfile, 
  user2Profile: MatchDataProfile,
  relationshipStatus: string = 'dating',
  satisfactionScore?: number,
  notes?: string
): Promise<boolean> => {
  try {
    if (isDemoMode()) {
      console.log('Demo mode: Match data would be stored');
      return true;
    }

    // Create a unique match data ID
    const matchDataId = `${user1Id}_${user2Id}_${Date.now()}`;
    
    const matchDataRecord: MatchDataRecord = {
      id: matchDataId,
      user1Profile,
      user2Profile,
      matchDate: new Date(),
      isActive: true,
      relationshipStatus: relationshipStatus as any,
      satisfactionScore,
      notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in matchData collection
    const matchDataRef = doc(db, 'matchData', matchDataId);
    await setDoc(matchDataRef, {
      ...matchDataRecord,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error storing match data:', error);
    return false;
  }
};

/**
 * Get all stored match data records
 */
export const getAllMatchData = async (): Promise<MatchDataRecord[]> => {
  try {
    if (isDemoMode()) {
      return [];
    }

    const matchDataRef = collection(db, 'matchData');
    const matchDataSnapshot = await getDocs(matchDataRef);
    
    const matchDataRecords: MatchDataRecord[] = [];
    matchDataSnapshot.forEach((doc) => {
      const data = doc.data();
      matchDataRecords.push({
        id: doc.id,
        ...data,
        matchDate: data.matchDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as MatchDataRecord);
    });
    
    return matchDataRecords;
  } catch (error) {
    console.error('Error fetching match data:', error);
    return [];
  }
};

/**
 * Update match data record
 */
export const updateMatchData = async (
  matchDataId: string,
  updates: Partial<MatchDataRecord>
): Promise<boolean> => {
  try {
    if (isDemoMode()) {
      return true;
    }

    const matchDataRef = doc(db, 'matchData', matchDataId);
    await updateDoc(matchDataRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error updating match data:', error);
    return false;
  }
};

/**
 * Get match data collection statistics
 */
export const getMatchDataStats = async (): Promise<MatchDataCollection> => {
  try {
    if (isDemoMode()) {
      return {
        totalMatches: 0,
        activeMatches: 0,
        averageSatisfaction: 0,
        lastUpdated: new Date()
      };
    }

    const matchDataRecords = await getAllMatchData();
    
    const totalMatches = matchDataRecords.length;
    const activeMatches = matchDataRecords.filter(record => record.isActive).length;
    
    const satisfactionScores = matchDataRecords
      .filter(record => record.satisfactionScore !== undefined)
      .map(record => record.satisfactionScore!);
    
    const averageSatisfaction = satisfactionScores.length > 0 
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0;

    return {
      totalMatches,
      activeMatches,
      averageSatisfaction,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error getting match data stats:', error);
    return {
      totalMatches: 0,
      activeMatches: 0,
      averageSatisfaction: 0,
      lastUpdated: new Date()
    };
  }
};

/**
 * Convert user profile to MatchDataProfile format
 */
export const convertUserToMatchDataProfile = (userId: string, userData: any): MatchDataProfile => {
  return {
    userId,
    name: userData.name || '',
    age: userData.age || 0,
    bio: userData.bio || '',
    city: userData.city || '',
    interests: userData.interests || [],
    hobbies: userData.hobbies || [],
    education: userData.education || '',
    occupation: userData.occupation || '',
    height: userData.height || '',
    relationshipStatus: userData.relationshipStatus || '',
    lookingFor: userData.lookingFor || '',
    lifestyle: userData.lifestyle || [],
    personality: userData.personality || [],
    dealBreakers: userData.dealBreakers || [],
    funFacts: userData.funFacts || [],
    photos: userData.photos || [],
    questionnaireResponses: userData.questionnaireResponses || {}
  };
};
