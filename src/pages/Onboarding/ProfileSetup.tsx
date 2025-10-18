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

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
  'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis',
  'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville',
  'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville'
];

const ProfileSetup: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    bio: '',
    city: '',
    interests: [] as string[],
    photos: [] as string[],
    preferences: {
      minAge: 18,
      maxAge: 35,
      interestedIn: 'both' as 'men' | 'women' | 'both',
      cities: [] as string[]
    }
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

  const handleSubmit = async () => {
    if (!currentUser) return;

    // Rate limiting check
    const rateLimitResult = rateLimiter.isAllowed(currentUser.uid, 'profile_update');
    if (!rateLimitResult.allowed) {
      toast({
        title: "Rate Limit Exceeded",
        description: "Too many profile updates. Please wait before trying again.",
        variant: "destructive",
      });
      return;
    }

    // Sanitize input data
    const sanitizedData = {
      ...formData,
      name: InputSanitizer.sanitizeText(formData.name),
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
          age: userData.age,
          bio: userData.bio,
          city: userData.city,
          interests: userData.interests,
          photos: userData.photos, // Photos are now Firebase Storage URLs
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
        
        // Add a small delay to ensure Firestore has time to index the document
        console.log('Waiting for Firestore indexing...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('About to navigate to /discover...');
        navigate('/discover');
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
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Tell us about yourself</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your name? *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your name"
                required
              />
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
            <span>Step {step} of 4</span>
            <span>{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {renderStep()}

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
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
