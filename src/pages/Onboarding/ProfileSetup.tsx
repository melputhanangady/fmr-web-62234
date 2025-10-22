import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import PhotoUpload from '../../components/PhotoUpload/PhotoUpload';
import { isDemoMode } from '../../utils/demoMode';
import { useToast } from '@/hooks/use-toast';
import { validateUserProfile, sanitizeString } from '../../utils/validation';
import { InputSanitizer } from '../../utils/sanitizer';
import { rateLimiter } from '../../utils/rateLimiter';

const INTERESTS = [
  'Travel', 'Music', 'Sports', 'Art', 'Food', 'Movies', 'Books', 'Fitness',
  'Photography', 'Dancing', 'Gaming', 'Cooking', 'Nature', 'Technology',
  'Fashion', 'Adventure', 'Yoga', 'Coffee', 'Wine', 'Pets'
];

const HOBBIES = [
  'Photography', 'Hiking', 'Cooking', 'Travel', 'Reading', 'Yoga', 'Dancing',
  'Painting', 'Gardening', 'Swimming', 'Cycling', 'Running', 'Meditation',
  'Writing', 'Learning Languages', 'Volunteering', 'Board Games', 'Chess'
];

const EDUCATION_LEVELS = [
  'High School', 'Some College', 'Associate Degree', 'Bachelor\'s Degree',
  'Master\'s Degree', 'Doctorate', 'Professional Degree'
];

const OCCUPATIONS = [
  'Software Engineer', 'Teacher', 'Doctor', 'Nurse', 'Lawyer', 'Accountant',
  'Marketing Manager', 'Sales Representative', 'Designer', 'Artist', 'Writer',
  'Consultant', 'Entrepreneur', 'Student', 'Retired', 'Other'
];

const HEIGHTS = [
  '4\'0"', '4\'1"', '4\'2"', '4\'3"', '4\'4"', '4\'5"', '4\'6"', '4\'7"',
  '4\'8"', '4\'9"', '4\'10"', '4\'11"', '5\'0"', '5\'1"', '5\'2"', '5\'3"',
  '5\'4"', '5\'5"', '5\'6"', '5\'7"', '5\'8"', '5\'9"', '5\'10"', '5\'11"',
  '6\'0"', '6\'1"', '6\'2"', '6\'3"', '6\'4"', '6\'5"', '6\'6"', '6\'7"', '6\'8"'
];

const RELATIONSHIP_STATUS = [
  'Single', 'Divorced', 'Widowed', 'Separated'
];

const LOOKING_FOR = [
  'Long-term relationship', 'Short-term relationship', 'Marriage', 'Friendship',
  'Casual dating', 'Not sure yet'
];

const LIFESTYLE_OPTIONS = [
  'Non-smoker', 'Occasionally drinks', 'Regularly drinks', 'Never drinks',
  'Vegetarian', 'Vegan', 'Pescatarian', 'Omnivore', 'Keto', 'Gluten-free',
  'Early bird', 'Night owl', 'Gym enthusiast', 'Outdoor lover', 'Homebody'
];

const PERSONALITY_TRAITS = [
  'Adventurous', 'Creative', 'Optimistic', 'Independent', 'Caring', 'Funny',
  'Intellectual', 'Spontaneous', 'Organized', 'Relaxed', 'Ambitious', 'Loyal',
  'Honest', 'Confident', 'Humble', 'Passionate', 'Calm', 'Energetic'
];

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
  'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis',
  'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville',
  'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville',
  'Miami'
];

const ProfileSetup: React.FC = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    age: '',
    bio: '',
    city: '',
    interests: [] as string[],
    photos: [] as string[],
    // Additional profile fields
    hobbies: [] as string[],
    education: '',
    occupation: '',
    height: '',
    relationshipStatus: 'Single',
    lookingFor: 'Long-term relationship',
    lifestyle: [] as string[],
    personality: [] as string[],
    dealBreakers: [] as string[],
    funFacts: [] as string[],
    preferences: {
      minAge: 18,
      maxAge: 35,
      interestedIn: 'both' as 'men' | 'women' | 'both',
      cities: [] as string[]
    },
    role: 'regular' as 'regular' | 'matchmaker',
    // MatchMaker specific fields
    businessName: '',
    licenseNumber: '',
    experience: 0,
    specialties: [] as string[],
    contactEmail: '',
    phoneNumber: '',
    website: '',
    socialMedia: {
      instagram: '',
      linkedin: '',
      facebook: ''
    },
    professionalBio: '',
    verificationDocuments: [] as string[]
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleCityToggle = (city: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        cities: prev.preferences.cities.includes(city)
          ? prev.preferences.cities.filter(c => c !== city)
          : [...prev.preferences.cities, city]
      }
    }));
  };

  const handleHobbyToggle = (hobby: string) => {
    setFormData(prev => ({
      ...prev,
      hobbies: prev.hobbies.includes(hobby)
        ? prev.hobbies.filter(h => h !== hobby)
        : [...prev.hobbies, hobby]
    }));
  };

  const handleLifestyleToggle = (option: string) => {
    setFormData(prev => ({
      ...prev,
      lifestyle: prev.lifestyle.includes(option)
        ? prev.lifestyle.filter(l => l !== option)
        : [...prev.lifestyle, option]
    }));
  };

  const handlePersonalityToggle = (trait: string) => {
    setFormData(prev => ({
      ...prev,
      personality: prev.personality.includes(trait)
        ? prev.personality.filter(p => p !== trait)
        : [...prev.personality, trait]
    }));
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    // Rate limiting check for profile creation
    const rateLimitResult = rateLimiter.isAllowed(currentUser.uid, 'profile_create');
    if (!rateLimitResult.allowed) {
      toast({
        title: "Rate Limit Exceeded",
        description: "Too many profile creation attempts. Please wait before trying again.",
        variant: "destructive",
      });
      return;
    }

    // Sanitize input data
    const sanitizedData = {
      ...formData,
      name: InputSanitizer.sanitizeText(`${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim()),
      firstName: InputSanitizer.sanitizeText(formData.firstName),
      middleName: InputSanitizer.sanitizeText(formData.middleName),
      lastName: InputSanitizer.sanitizeText(formData.lastName),
      bio: InputSanitizer.sanitizeHtml(formData.bio),
      city: InputSanitizer.sanitizeText(formData.city),
      interests: formData.interests.map(interest => InputSanitizer.sanitizeText(interest))
    };

    // Validate the profile data (photos not required for initial setup)
    const validationResult = validateUserProfile({
      ...sanitizedData,
      age: parseInt(formData.age),
      photos: formData.photos,
      preferences: formData.preferences
    }, false); // Make photos optional for initial setup

    if (!validationResult.isValid) {
      toast({
        title: "Validation Failed",
        description: validationResult.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const userData = {
        ...sanitizedData,
        age: parseInt(formData.age),
        createdAt: new Date(),
        likedUsers: [],
        passedUsers: [],
        matches: []
      };

      if (isDemoMode()) {
        // In demo mode, just store in localStorage
        console.log('Demo mode: Storing profile in localStorage');
        localStorage.setItem('demo-user-profile', JSON.stringify(userData));
        console.log('Demo mode: Profile stored, navigating to discover...');
        toast({
          title: "Success",
          description: "Profile created successfully! (Demo mode)",
        });
        navigate('/discover');
      } else {
        console.log('Production mode: Saving to Firebase');
        // In production mode, save to Firebase
        // Store profile with photos in production mode
        const profileData = {
          name: userData.name,
          firstName: userData.firstName,
          middleName: userData.middleName,
          lastName: userData.lastName,
          age: userData.age,
          bio: userData.bio,
          city: userData.city,
          interests: userData.interests,
          photos: userData.photos, // Photos are now Firebase Storage URLs
          // Additional profile fields
          hobbies: userData.hobbies,
          education: userData.education,
          occupation: userData.occupation,
          height: userData.height,
          relationshipStatus: userData.relationshipStatus,
          lookingFor: userData.lookingFor,
          lifestyle: userData.lifestyle,
          personality: userData.personality,
          dealBreakers: userData.dealBreakers,
          funFacts: userData.funFacts,
          preferences: userData.preferences,
          createdAt: userData.createdAt,
          likedUsers: userData.likedUsers,
          passedUsers: userData.passedUsers,
          matches: userData.matches
        };
        
        console.log('Creating user document for:', currentUser.uid);
        console.log('Profile data to save:', profileData);
        
        await setDoc(doc(db, 'users', currentUser.uid), profileData);
        console.log('User document created successfully');
        
        // Verify the profile was created by reading it back
        console.log('Verifying profile creation...');
        const verifyDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!verifyDoc.exists()) {
          throw new Error('Profile verification failed - document not found after creation');
        }
        console.log('Profile verification successful, navigating to discover page...');
        
        toast({
          title: "Success",
          description: "Profile created successfully! Photos uploaded to cloud storage.",
        });
        
        // Add a longer delay to ensure Firestore has time to index the document
        console.log('Waiting for Firestore indexing...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('About to navigate to /discover...');
        // Use window.location.href with a timestamp to force a full page reload and bypass cache issues
        const timestamp = Date.now();
        window.location.href = `/discover?t=${timestamp}`;
        console.log('Navigation command executed');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Choose your role</h2>
            <p className="text-gray-600">Select how you'd like to use Find My Rib</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.role === 'regular' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('role', 'regular')}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">👤</div>
                  <h3 className="text-xl font-semibold mb-2">Regular User</h3>
                  <p className="text-gray-600">
                    Create your profile and find matches. Perfect for individuals looking for love.
                  </p>
                </div>
              </div>
              
              <div 
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.role === 'matchmaker' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('role', 'matchmaker')}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold mb-2">MatchMaker</h3>
                  <p className="text-gray-600">
                    Upload and manage profiles for your clients. Verified MatchMakers can upload profiles with verification badges.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {formData.role === 'matchmaker' ? 'Tell us about your business' : 'Tell us about yourself'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your first name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your middle name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How old are you? *
              </label>
              <input
                type="number"
                min="18"
                max="100"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your age"
                required
              />
            </div>

            {/* MatchMaker specific fields */}
            {formData.role === 'matchmaker' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your business name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter license number (optional)"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter years of experience"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter contact email"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Bio *
                  </label>
                  <textarea
                    value={formData.professionalBio}
                    onChange={(e) => handleInputChange('professionalBio', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Tell us about your matchmaking experience and approach..."
                    rows={4}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Write a short bio *
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24 resize-none"
                placeholder="Tell us about yourself..."
                maxLength={500}
                required
              />
              <p className="text-sm text-gray-500 mt-1">{formData.bio.length}/500</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Where are you located? *
              </label>
              <select
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select your city</option>
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 2:
        return (
            <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Add some photos</h2>
            <p className="text-gray-600">Upload 3-6 photos to show who you are</p>
            
            {/* Firebase setup notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Photos are currently stored locally for demo purposes. 
                To enable cloud storage, set up Firebase Storage following the instructions in SETUP.md
              </p>
              <p className="text-sm text-blue-800 mt-2">
                <strong>Tip:</strong> Keep photos under 2MB each for better performance. 
                You can upload up to 6 photos, but 3-4 high-quality photos work best.
              </p>
            </div>
            
            <PhotoUpload
              onPhotosChange={(photos) => handleInputChange('photos', photos)}
              maxPhotos={6}
              currentPhotos={formData.photos}
              userId={currentUser?.uid}
            />
          </div>
        );

      case 3:
        // Skip interests step for MatchMaker users
        if (formData.role === 'matchmaker') {
          return null;
        }
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">What are you into?</h2>
            <p className="text-gray-600">Select your interests to help us find better matches</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INTERESTS.map(interest => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    formData.interests.includes(interest)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        // Skip preferences step for MatchMaker users
        if (formData.role === 'matchmaker') {
          return null;
        }
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Set your preferences</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Age
                </label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={formData.preferences.minAge}
                  onChange={(e) => handleInputChange('preferences', {
                    ...formData.preferences,
                    minAge: parseInt(e.target.value)
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Age
                </label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={formData.preferences.maxAge}
                  onChange={(e) => handleInputChange('preferences', {
                    ...formData.preferences,
                    maxAge: parseInt(e.target.value)
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interested in
              </label>
              <select
                value={formData.preferences.interestedIn}
                onChange={(e) => handleInputChange('preferences', {
                  ...formData.preferences,
                  interestedIn: e.target.value as 'men' | 'women' | 'both'
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="both">Everyone</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cities to match in (optional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {CITIES.map(city => (
                  <button
                    key={city}
                    onClick={() => handleCityToggle(city)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      formData.preferences.cities.includes(city)
                        ? 'bg-secondary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Tell us more about yourself</h2>
            <p className="text-gray-600">Help others get to know you better</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education Level
              </label>
              <select
                value={formData.education}
                onChange={(e) => handleInputChange('education', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select your education level</option>
                {EDUCATION_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Occupation
              </label>
              <select
                value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select your occupation</option>
                {OCCUPATIONS.map(occupation => (
                  <option key={occupation} value={occupation}>{occupation}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height
              </label>
              <select
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select your height</option>
                {HEIGHTS.map(height => (
                  <option key={height} value={height}>{height}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship Status
              </label>
              <select
                value={formData.relationshipStatus}
                onChange={(e) => handleInputChange('relationshipStatus', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {RELATIONSHIP_STATUS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are you looking for?
              </label>
              <select
                value={formData.lookingFor}
                onChange={(e) => handleInputChange('lookingFor', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {LOOKING_FOR.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Your hobbies & interests</h2>
            <p className="text-gray-600">What do you enjoy doing in your free time?</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {HOBBIES.map(hobby => (
                <button
                  key={hobby}
                  onClick={() => handleHobbyToggle(hobby)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    formData.hobbies.includes(hobby)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {hobby}
                </button>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Your lifestyle & personality</h2>
            <p className="text-gray-600">Help others understand your lifestyle and personality</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Lifestyle (select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {LIFESTYLE_OPTIONS.map(option => (
                  <button
                    key={option}
                    onClick={() => handleLifestyleToggle(option)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      formData.lifestyle.includes(option)
                        ? 'bg-secondary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Personality Traits (select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PERSONALITY_TRAITS.map(trait => (
                  <button
                    key={trait}
                    onClick={() => handlePersonalityToggle(trait)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      formData.personality.includes(trait)
                        ? 'bg-accent-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {trait}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Final touches</h2>
            <p className="text-gray-600">Add some fun facts and deal breakers</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fun Facts (one per line)
              </label>
              <textarea
                value={formData.funFacts.join('\n')}
                onChange={(e) => handleInputChange('funFacts', e.target.value.split('\n').filter(fact => fact.trim()))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24 resize-none"
                placeholder="I've visited 15 countries&#10;I can speak 3 languages&#10;I love trying new cuisines"
              />
              <p className="text-sm text-gray-500 mt-1">Enter one fun fact per line</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deal Breakers (one per line)
              </label>
              <textarea
                value={formData.dealBreakers.join('\n')}
                onChange={(e) => handleInputChange('dealBreakers', e.target.value.split('\n').filter(breaker => breaker.trim()))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24 resize-none"
                placeholder="Smoking&#10;Not interested in travel&#10;Doesn't like pets"
              />
              <p className="text-sm text-gray-500 mt-1">Enter one deal breaker per line</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Step {step + 1} of {formData.role === 'matchmaker' ? 7 : 9}</span>
            <span>{Math.round(((step + 1) / (formData.role === 'matchmaker' ? 7 : 9)) * 100)}%</span>
          </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / (formData.role === 'matchmaker' ? 6 : 8)) * 100}%` }}
              />
            </div>
        </div>

        {renderStep()}

        <div className="flex justify-between mt-8">
          <button
            onClick={() => {
              let prevStep = step - 1;
              // Skip steps 3 and 4 for MatchMaker users when going back
              if (formData.role === 'matchmaker') {
                if (prevStep === 4) prevStep = 2; // Skip preferences
                if (prevStep === 3) prevStep = 2; // Skip interests
              }
              setStep(prevStep);
            }}
            disabled={step === 0}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          {step < (formData.role === 'matchmaker' ? 6 : 8) ? (
            <button
              onClick={() => {
                let nextStep = step + 1;
                // Skip steps 3 and 4 for MatchMaker users
                if (formData.role === 'matchmaker') {
                  if (nextStep === 3) nextStep = 5; // Skip interests
                  if (nextStep === 4) nextStep = 5; // Skip preferences
                }
                setStep(nextStep);
              }}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Creating Profile...' : 'Complete Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
