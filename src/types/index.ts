export interface User {
  id: string;
  name: string;
  age: number;
  bio: string;
  city: string;
  interests: string[];
  photos: string[];
  preferences: {
    minAge: number;
    maxAge: number;
    interestedIn: 'men' | 'women' | 'both';
    cities: string[];
  };
  likedUsers: string[];
  passedUsers: string[];
  matches: string[];
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
