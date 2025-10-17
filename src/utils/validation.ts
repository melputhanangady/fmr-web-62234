// Comprehensive input validation utilities for production security

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Sanitization utilities
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 1000); // Limit length
};

export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embed tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove event handlers
};

// User profile validation
export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  } else if (name.length < 2) {
    errors.push('Name must be at least 2 characters');
  } else if (name.length > 50) {
    errors.push('Name must be less than 50 characters');
  } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateAge = (age: number | string): ValidationResult => {
  const errors: string[] = [];
  const ageNum = typeof age === 'string' ? parseInt(age, 10) : age;
  
  if (isNaN(ageNum)) {
    errors.push('Age must be a valid number');
  } else if (ageNum < 18) {
    errors.push('You must be at least 18 years old');
  } else if (ageNum > 100) {
    errors.push('Age must be less than 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateBio = (bio: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!bio || bio.trim().length === 0) {
    errors.push('Bio is required');
  } else if (bio.length < 10) {
    errors.push('Bio must be at least 10 characters');
  } else if (bio.length > 500) {
    errors.push('Bio must be less than 500 characters');
  } else if (bio.includes('<script') || bio.includes('javascript:')) {
    errors.push('Bio contains invalid content');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCity = (city: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!city || city.trim().length === 0) {
    errors.push('City is required');
  } else if (city.length < 2) {
    errors.push('City must be at least 2 characters');
  } else if (city.length > 50) {
    errors.push('City must be less than 50 characters');
  } else if (!/^[a-zA-Z\s-]+$/.test(city)) {
    errors.push('City can only contain letters, spaces, and hyphens');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateInterests = (interests: string[]): ValidationResult => {
  const errors: string[] = [];
  
  if (!interests || interests.length === 0) {
    errors.push('At least one interest is required');
  } else if (interests.length > 10) {
    errors.push('Maximum 10 interests allowed');
  } else {
    interests.forEach((interest, index) => {
      if (!interest || interest.trim().length === 0) {
        errors.push(`Interest ${index + 1} cannot be empty`);
      } else if (interest.length > 30) {
        errors.push(`Interest ${index + 1} must be less than 30 characters`);
      } else if (!/^[a-zA-Z\s-]+$/.test(interest)) {
        errors.push(`Interest ${index + 1} contains invalid characters`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePhotos = (photos: string[]): ValidationResult => {
  const errors: string[] = [];
  
  if (!photos || photos.length === 0) {
    errors.push('At least one photo is required');
  } else if (photos.length > 6) {
    errors.push('Maximum 6 photos allowed');
  } else {
    photos.forEach((photo, index) => {
      if (!photo || photo.trim().length === 0) {
        errors.push(`Photo ${index + 1} is required`);
      } else if (!isValidImageUrl(photo)) {
        errors.push(`Photo ${index + 1} has an invalid URL`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePreferences = (preferences: {
  minAge: number;
  maxAge: number;
  interestedIn: string;
  cities: string[];
}): ValidationResult => {
  const errors: string[] = [];
  
  // Validate age range
  if (preferences.minAge < 18 || preferences.minAge > 100) {
    errors.push('Minimum age must be between 18 and 100');
  }
  
  if (preferences.maxAge < 18 || preferences.maxAge > 100) {
    errors.push('Maximum age must be between 18 and 100');
  }
  
  if (preferences.minAge > preferences.maxAge) {
    errors.push('Minimum age cannot be greater than maximum age');
  }
  
  // Validate interested in
  if (!['men', 'women', 'both'].includes(preferences.interestedIn)) {
    errors.push('Invalid preference for interested in');
  }
  
  // Validate cities
  if (preferences.cities.length > 5) {
    errors.push('Maximum 5 cities allowed in preferences');
  }
  
  preferences.cities.forEach((city, index) => {
    if (!city || city.trim().length === 0) {
      errors.push(`City preference ${index + 1} cannot be empty`);
    } else if (city.length > 50) {
      errors.push(`City preference ${index + 1} must be less than 50 characters`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Message validation
export const validateMessage = (text: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!text || text.trim().length === 0) {
    errors.push('Message cannot be empty');
  } else if (text.length > 1000) {
    errors.push('Message must be less than 1000 characters');
  } else if (text.includes('<script') || text.includes('javascript:')) {
    errors.push('Message contains invalid content');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  } else if (email.length > 254) {
    errors.push('Email must be less than 254 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password || password.length === 0) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  } else if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  } else if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Utility functions
export const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const validProtocols = ['http:', 'https:'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    return validProtocols.includes(urlObj.protocol) &&
           validExtensions.some(ext => url.toLowerCase().includes(ext));
  } catch {
    return false;
  }
};

export const isValidUserId = (userId: string): boolean => {
  return userId && userId.length > 0 && userId.length < 100;
};

// Alias for backward compatibility
export const validateUserId = isValidUserId;

// Rate limiting (client-side basic check)
export const checkRateLimit = (action: string, userId: string): boolean => {
  const key = `rate_limit_${action}_${userId}`;
  const now = Date.now();
  const lastAction = localStorage.getItem(key);
  
  if (lastAction) {
    const timeDiff = now - parseInt(lastAction, 10);
    const minInterval = getMinInterval(action);
    
    if (timeDiff < minInterval) {
      return false;
    }
  }
  
  localStorage.setItem(key, now.toString());
  return true;
};

const getMinInterval = (action: string): number => {
  switch (action) {
    case 'like':
    case 'pass':
      return 1000; // 1 second between likes/passes
    case 'message':
      return 500; // 0.5 seconds between messages
    case 'profile_update':
      return 5000; // 5 seconds between profile updates
    default:
      return 1000;
  }
};

// Comprehensive user profile validation
export const validateUserProfile = (profile: {
  name: string;
  age: number;
  bio: string;
  city: string;
  interests: string[];
  photos: string[];
  preferences: {
    minAge: number;
    maxAge: number;
    interestedIn: string;
    cities: string[];
  };
}): ValidationResult => {
  const allErrors: string[] = [];
  
  // Validate each field
  const nameResult = validateName(profile.name);
  const ageResult = validateAge(profile.age);
  const bioResult = validateBio(profile.bio);
  const cityResult = validateCity(profile.city);
  const interestsResult = validateInterests(profile.interests);
  const photosResult = validatePhotos(profile.photos);
  const preferencesResult = validatePreferences(profile.preferences);
  
  // Collect all errors
  allErrors.push(...nameResult.errors);
  allErrors.push(...ageResult.errors);
  allErrors.push(...bioResult.errors);
  allErrors.push(...cityResult.errors);
  allErrors.push(...interestsResult.errors);
  allErrors.push(...photosResult.errors);
  allErrors.push(...preferencesResult.errors);
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};
