// Demo users for testing the app without Firebase
import type { User } from '../types';

export const getDemoUsers = (): User[] => [
  {
    id: 'demo-user-1',
    name: 'Sarah Johnson',
    age: 25,
    bio: 'Love hiking, photography, and trying new restaurants. Looking for someone to explore the city with!',
    city: 'New York',
    interests: ['Photography', 'Hiking', 'Food', 'Travel'],
    photos: [
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop'
    ],
    preferences: {
      minAge: 22,
      maxAge: 30,
      interestedIn: 'both',
      cities: ['New York', 'Los Angeles']
    },
    likedUsers: [],
    passedUsers: [],
    matches: []
  },
  {
    id: 'demo-user-2',
    name: 'Mike Chen',
    age: 28,
    bio: 'Software engineer who loves gaming, cooking, and weekend adventures. Always up for trying something new!',
    city: 'San Francisco',
    interests: ['Gaming', 'Cooking', 'Technology', 'Adventure'],
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop'
    ],
    preferences: {
      minAge: 24,
      maxAge: 32,
      interestedIn: 'both',
      cities: ['San Francisco', 'Seattle']
    },
    likedUsers: [],
    passedUsers: [],
    matches: []
  },
  {
    id: 'demo-user-3',
    name: 'Emma Davis',
    age: 26,
    bio: 'Artist and yoga instructor. Passionate about wellness, creativity, and making the world a better place.',
    city: 'Los Angeles',
    interests: ['Art', 'Yoga', 'Nature', 'Fitness'],
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop'
    ],
    preferences: {
      minAge: 23,
      maxAge: 31,
      interestedIn: 'both',
      cities: ['Los Angeles', 'San Diego']
    },
    likedUsers: [],
    passedUsers: [],
    matches: []
  },
  {
    id: 'demo-user-4',
    name: 'Alex Rodriguez',
    age: 29,
    bio: 'Musician and coffee enthusiast. Love live music, good books, and deep conversations over coffee.',
    city: 'Austin',
    interests: ['Music', 'Coffee', 'Books', 'Dancing'],
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop'
    ],
    preferences: {
      minAge: 25,
      maxAge: 33,
      interestedIn: 'both',
      cities: ['Austin', 'Nashville']
    },
    likedUsers: [],
    passedUsers: [],
    matches: []
  },
  {
    id: 'demo-user-5',
    name: 'Jessica Kim',
    age: 27,
    bio: 'Marketing professional who loves travel, wine tasting, and discovering hidden gems in the city.',
    city: 'Chicago',
    interests: ['Travel', 'Wine', 'Fashion', 'Adventure'],
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop'
    ],
    preferences: {
      minAge: 24,
      maxAge: 32,
      interestedIn: 'both',
      cities: ['Chicago', 'New York']
    },
    likedUsers: [],
    passedUsers: [],
    matches: []
  }
];
