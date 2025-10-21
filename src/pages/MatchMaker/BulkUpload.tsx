import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Users, CheckCircle, AlertCircle, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '../../types';

interface BulkProfileData {
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
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
  preferences: {
    minAge: number;
    maxAge: number;
    interestedIn: 'men' | 'women' | 'both';
    cities: string[];
  };
  photos: string[];
}

const BulkUpload: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profiles, setProfiles] = useState<BulkProfileData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isMatchmaker, setIsMatchmaker] = useState(false);
  const [newProfile, setNewProfile] = useState<BulkProfileData>({
    name: '',
    firstName: '',
    lastName: '',
    age: 25,
    bio: '',
    city: '',
    interests: [],
    preferences: {
      minAge: 18,
      maxAge: 35,
      interestedIn: 'both',
      cities: []
    },
    photos: []
  });

  const [newInterest, setNewInterest] = useState('');
  const [newCity, setNewCity] = useState('');

  React.useEffect(() => {
    checkMatchmakerStatus();
  }, [currentUser]);

  const checkMatchmakerStatus = async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsMatchmaker(userData.role === 'matchmaker' && userData.isMatchmakerVerified);
      }
    } catch (error) {
      console.error('Error checking matchmaker status:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        if (Array.isArray(jsonData)) {
          setProfiles(jsonData);
          toast({
            title: "Success",
            description: `Loaded ${jsonData.length} profiles from file`,
          });
        } else {
          toast({
            title: "Error",
            description: "Invalid file format. Please upload a JSON array of profiles.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to parse JSON file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const addProfile = () => {
    if (newProfile.name && newProfile.firstName && newProfile.lastName && newProfile.bio && newProfile.city) {
      setProfiles(prev => [...prev, { ...newProfile }]);
      setNewProfile({
        name: '',
        firstName: '',
        lastName: '',
        age: 25,
        bio: '',
        city: '',
        interests: [],
        preferences: {
          minAge: 18,
          maxAge: 35,
          interestedIn: 'both',
          cities: []
        },
        photos: []
      });
    }
  };

  const removeProfile = (index: number) => {
    setProfiles(prev => prev.filter((_, i) => i !== index));
  };

  const addInterest = () => {
    if (newInterest.trim() && !newProfile.interests.includes(newInterest.trim())) {
      setNewProfile(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setNewProfile(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const addCity = () => {
    if (newCity.trim() && !newProfile.preferences.cities.includes(newCity.trim())) {
      setNewProfile(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          cities: [...prev.preferences.cities, newCity.trim()]
        }
      }));
      setNewCity('');
    }
  };

  const removeCity = (city: string) => {
    setNewProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        cities: prev.preferences.cities.filter(c => c !== city)
      }
    }));
  };

  const uploadProfiles = async () => {
    if (!currentUser || profiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < profiles.length; i++) {
        const profile = profiles[i];
        
        // Create user document with MatchMaker verification
        const userData: User = {
          id: '', // Will be set by Firestore
          name: profile.name,
          firstName: profile.firstName,
          middleName: profile.middleName,
          lastName: profile.lastName,
          age: profile.age,
          bio: profile.bio,
          city: profile.city,
          interests: profile.interests,
          photos: profile.photos,
          hobbies: profile.hobbies,
          education: profile.education,
          occupation: profile.occupation,
          height: profile.height,
          relationshipStatus: profile.relationshipStatus,
          lookingFor: profile.lookingFor,
          lifestyle: profile.lifestyle,
          personality: profile.personality,
          dealBreakers: profile.dealBreakers,
          funFacts: profile.funFacts,
          preferences: profile.preferences,
          likedUsers: [],
          passedUsers: [],
          matches: [],
          role: 'regular',
          isMatchmakerVerified: true, // Mark as verified by MatchMaker
          matchmakerInfo: {
            verifiedBy: currentUser.uid,
            verifiedAt: new Date()
          }
        };

        await addDoc(collection(db, 'users'), userData);
        
        setUploadProgress(((i + 1) / profiles.length) * 100);
      }

      toast({
        title: "Success",
        description: `Successfully uploaded ${profiles.length} verified profiles!`,
      });

      setProfiles([]);
    } catch (error) {
      console.error('Error uploading profiles:', error);
      toast({
        title: "Error",
        description: "Failed to upload profiles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isMatchmaker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You need to be a verified MatchMaker to access this feature.
          </p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bulk Profile Upload</h1>
              <p className="text-gray-600">Upload multiple verified profiles with MatchMaker verification</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Upload Profiles</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Upload JSON File</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload a JSON file containing an array of profile objects
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Or Add Profile Manually</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="First Name"
                        value={newProfile.firstName}
                        onChange={(e) => setNewProfile(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                      <Input
                        placeholder="Last Name"
                        value={newProfile.lastName}
                        onChange={(e) => setNewProfile(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                    
                    <Input
                      placeholder="Full Name"
                      value={newProfile.name}
                      onChange={(e) => setNewProfile(prev => ({ ...prev, name: e.target.value }))}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Age"
                        type="number"
                        value={newProfile.age}
                        onChange={(e) => setNewProfile(prev => ({ ...prev, age: parseInt(e.target.value) || 25 }))}
                      />
                      <Input
                        placeholder="City"
                        value={newProfile.city}
                        onChange={(e) => setNewProfile(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    
                    <Textarea
                      placeholder="Bio"
                      value={newProfile.bio}
                      onChange={(e) => setNewProfile(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                    />
                    
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add interest"
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                      />
                      <Button onClick={addInterest} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {newProfile.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                          <span>{interest}</span>
                          <button
                            onClick={() => removeInterest(interest)}
                            className="ml-1 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    
                    <Button onClick={addProfile} className="w-full">
                      Add Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profiles List */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Profiles to Upload ({profiles.length})</span>
                  {profiles.length > 0 && (
                    <Button 
                      onClick={uploadProfiles} 
                      disabled={uploading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {uploading ? 'Uploading...' : 'Upload All'}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {uploading && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Upload Progress</span>
                      <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                {profiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No profiles to upload</p>
                    <p className="text-sm">Add profiles manually or upload a JSON file</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {profiles.map((profile, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{profile.name}</p>
                            <p className="text-sm text-gray-600">{profile.age} • {profile.city}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProfile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;
