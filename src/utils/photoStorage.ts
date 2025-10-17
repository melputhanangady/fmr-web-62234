// Photo storage utilities for handling images without Firestore size limits

export const savePhotosToLocal = (userId: string, photos: string[]): void => {
  try {
    localStorage.setItem(`user-photos-${userId}`, JSON.stringify(photos));
  } catch (error) {
    console.error('Error saving photos to localStorage:', error);
  }
};

export const getPhotosFromLocal = (userId: string): string[] => {
  try {
    const photos = localStorage.getItem(`user-photos-${userId}`);
    return photos ? JSON.parse(photos) : [];
  } catch (error) {
    console.error('Error loading photos from localStorage:', error);
    return [];
  }
};

export const clearPhotosFromLocal = (userId: string): void => {
  try {
    localStorage.removeItem(`user-photos-${userId}`);
  } catch (error) {
    console.error('Error clearing photos from localStorage:', error);
  }
};

// Helper to get user photos with fallback
export const getUserPhotos = (userId: string, fallbackPhotos: string[] = []): string[] => {
  const localPhotos = getPhotosFromLocal(userId);
  return localPhotos.length > 0 ? localPhotos : fallbackPhotos;
};
