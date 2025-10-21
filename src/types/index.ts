export type UserRole = 'regular' | 'matchmaker';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  age: number;
  bio: string;
  city: string;
  interests: string[];
  photos: string[];
  // Additional profile fields
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
  preferences: {
    minAge: number;
    maxAge: number;
    interestedIn: 'men' | 'women' | 'both';
    cities: string[];
  };
  likedUsers: string[];
  passedUsers: string[];
  matches: string[];
  // Role and verification
  role: UserRole;
  isMatchmakerVerified?: boolean;
  matchmakerInfo?: MatchmakerInfo;
}

export interface MatchmakerInfo {
  businessName: string;
  licenseNumber?: string;
  experience: number; // years
  specialties: string[];
  contactEmail: string;
  phoneNumber?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
  };
  bio: string;
  profilePhoto?: string;
  verificationDocuments?: string[]; // URLs to uploaded documents
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string; // Admin user ID who verified
}

export interface Match {
  id: string;
  users: string[];
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
}

export interface ChatUser {
  id: string;
  name: string;
  photos: string[];
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}
