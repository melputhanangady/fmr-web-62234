// Photo storage utilities for handling images with Firebase Storage

import { isDemoMode } from './demoMode';

export const savePhotosToLocal = (userId: string, photos: string[]): void => {
  // Only save to localStorage in demo mode
  if (isDemoMode()) {
    try {
      localStorage.setItem(`user-photos-${userId}`, JSON.stringify(photos));
    } catch (error) {
      console.error('Error saving photos to localStorage:', error);
    }
  }
  // In production mode, photos are stored in Firebase Storage and URLs in Firestore
};

export const getPhotosFromLocal = (userId: string): string[] => {
  // Only get from localStorage in demo mode
  if (isDemoMode()) {
    try {
      const photos = localStorage.getItem(`user-photos-${userId}`);
      return photos ? JSON.parse(photos) : [];
    } catch (error) {
      console.error('Error loading photos from localStorage:', error);
      return [];
    }
  }
  return [];
};

export const clearPhotosFromLocal = (userId: string): void => {
  // Only clear localStorage in demo mode
  if (isDemoMode()) {
    try {
      localStorage.removeItem(`user-photos-${userId}`);
    } catch (error) {
      console.error('Error clearing photos from localStorage:', error);
    }
  }
};

// Helper to get user photos with fallback
export const getUserPhotos = (userId: string, fallbackPhotos: string[] = []): string[] => {
  if (isDemoMode()) {
    const localPhotos = getPhotosFromLocal(userId);
    return localPhotos.length > 0 ? localPhotos : fallbackPhotos;
  } else {
    // In production mode, photos come from Firestore (fallbackPhotos)
    return fallbackPhotos;
  }
};
