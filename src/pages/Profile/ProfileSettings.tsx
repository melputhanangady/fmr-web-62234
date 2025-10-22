import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import PhotoUpload from '../../components/PhotoUpload/PhotoUpload';
import { isDemoMode } from '../../utils/demoMode';
import { savePhotosToLocal, getUserPhotos } from '../../utils/photoStorage';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';

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
  'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville',
  'Miami'
];

interface UserProfile {
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
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
}

const ProfileSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');
  const [userRole, setUserRole] = useState<'regular' | 'matchmaker' | 'admin'>('regular');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    firstName: '',
    middleName: '',
    lastName: '',
    age: 25,
    bio: '',
    city: '',
    interests: [],
    photos: [],
    preferences: {
      minAge: 18,
      maxAge: 35,
      interestedIn: 'both',
      cities: []
    }
  });

  useEffect(() => {
    if (!currentUser) {
      console.log('No current user, redirecting to login');
      navigate('/login');
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        console.log('Loading profile for user:', currentUser.uid);
        
        if (isDemoMode()) {
          console.log('Loading demo profile from localStorage');
          const demoProfile = localStorage.getItem('demo-user-profile');
          if (demoProfile) {
            const userData = JSON.parse(demoProfile);
            setProfile({
              name: userData.name || '',
              firstName: userData.firstName || '',
              middleName: userData.middleName || '',
              lastName: userData.lastName || '',
              age: userData.age || 25,
              bio: userData.bio || '',
              city: userData.city || '',
              interests: userData.interests || [],
              photos: userData.photos || [],
              preferences: userData.preferences || {
                minAge: 18,
                maxAge: 35,
                interestedIn: 'both',
                cities: []
              }
            });
          } else {
            console.log('No demo profile found, using defaults');
            // Keep default profile values
          }
        } else {
          console.log('Loading profile from Firestore');
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Profile data loaded:', userData);
            console.log('Photos from Firestore:', userData.photos);
            
            // Set user role
            setUserRole(userData.role || 'regular');
            
            // Redirect MatchMaker users to MatchMaker profile page
            if (userData.role === 'matchmaker') {
              navigate('/matchmaker/profile');
              return;
            }
            
            // Get photos from Firebase Storage URLs (stored in Firestore)
            const photos = getUserPhotos(currentUser.uid, userData.photos || []);
            console.log('Photos after getUserPhotos:', photos);
            
            setProfile({
              name: userData.name || '',
              firstName: userData.firstName || '',
              middleName: userData.middleName || '',
              lastName: userData.lastName || '',
              age: userData.age || 25,
              bio: userData.bio || '',
              city: userData.city || '',
              interests: userData.interests || [],
              photos: photos,
              preferences: userData.preferences || {
                minAge: 18,
                maxAge: 35,
                interestedIn: 'both',
                cities: []
              }
            });
          } else {
            console.log('No profile document found in Firestore');
            toast({
              title: "No Profile Found",
              description: "Please complete your profile setup first",
              variant: "destructive",
            });
            navigate('/onboarding');
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: `Failed to load profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser, navigate]);

  const handleInputChange = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (field: string, value: any) => {
    console.log('Changing preference:', field, 'to', value);
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleCityToggle = (city: string) => {
    console.log('Toggling city:', city);
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        cities: prev.preferences.cities.includes(city)
          ? prev.preferences.cities.filter(c => c !== city)
          : [...prev.preferences.cities, city]
      }
    }));
  };

  const handleSave = async () => {
    if (!currentUser) return;

    console.log('Saving profile with preferences:', profile.preferences);

    // Validate required name fields
    if (!profile.firstName || !profile.lastName || !profile.bio || !profile.city) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (First Name, Last Name, Bio, City)",
        variant: "destructive",
      });
      return;
    }

    if (profile.photos.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one photo",
        variant: "destructive",
      });
      return;
    }

    if (profile.interests.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one interest",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      if (isDemoMode()) {
        // In demo mode, store in localStorage
        const profileData = {
          ...profile,
          updatedAt: new Date()
        };
        localStorage.setItem('demo-user-profile', JSON.stringify(profileData));
        console.log('Saved to localStorage:', profileData);
        toast({
          title: "Success",
          description: "Profile updated successfully! (Demo mode)",
        });
      } else {
        // In production mode, save to Firebase
        // Note: savePhotosToLocal does nothing in production mode (photos are in Firebase Storage)
        savePhotosToLocal(currentUser.uid, profile.photos);
        
        // Store profile data with photo URLs
        const profileData = {
          name: profile.name || `${profile.firstName} ${profile.middleName} ${profile.lastName}`.trim(),
          firstName: profile.firstName,
          middleName: profile.middleName,
          lastName: profile.lastName,
          age: profile.age,
          bio: profile.bio,
          city: profile.city,
          interests: profile.interests,
          photos: profile.photos, // Save photo URLs to Firestore
          preferences: profile.preferences,
          updatedAt: new Date()
        };
        
        console.log('Saving to Firebase:', profileData);
        console.log('Photos being saved:', profile.photos);
        await updateDoc(doc(db, 'users', currentUser.uid), profileData);
        toast({
          title: "Success",
          description: "Profile updated successfully! (Photos saved to cloud storage)",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Try reducing the number of photos.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-primary-100">Manage your profile and preferences</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'profile'
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Profile
              </button>
              {/* Hide Preferences tab for MatchMaker users */}
              {userRole !== 'matchmaker' && (
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'preferences'
                      ? 'text-primary-500 border-b-2 border-primary-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Preferences
                </button>
              )}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'profile' ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={profile.firstName}
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
                          value={profile.middleName}
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
                          value={profile.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Enter your last name"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={profile.age}
                      onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio *
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24 resize-none"
                    maxLength={500}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">{profile.bio.length}/500</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <select
                    value={profile.city}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos *
                  </label>
                  <PhotoUpload
                    onPhotosChange={(photos) => handleInputChange('photos', photos)}
                    maxPhotos={6}
                    currentPhotos={profile.photos}
                    userId={currentUser?.uid}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interests *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {INTERESTS.map(interest => (
                      <button
                        key={interest}
                        onClick={() => handleInterestToggle(interest)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          profile.interests.includes(interest)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Match Preferences</h2>
                    </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Age
                    </label>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={profile.preferences.minAge}
                      onChange={(e) => handlePreferenceChange('minAge', parseInt(e.target.value))}
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
                      value={profile.preferences.maxAge}
                      onChange={(e) => handlePreferenceChange('maxAge', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interested in
                  </label>
                  <select
                    value={profile.preferences.interestedIn}
                    onChange={(e) => handlePreferenceChange('interestedIn', e.target.value)}
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
                          profile.preferences.cities.includes(city)
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
            )}

            {/* Action Buttons */}
            <div className="flex flex-col space-y-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-400 transition-colors font-semibold text-lg"
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full px-6 py-3 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ProfileSettings;
