import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, CheckCircle, Building, Mail, Phone, Globe, Instagram, Linkedin, Facebook, FileText, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MatchmakerInfo } from '../../types';

const MatchMakerProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matchmakerInfo, setMatchmakerInfo] = useState<MatchmakerInfo>({
    businessName: '',
    licenseNumber: '',
    experience: 0,
    specialties: [],
    contactEmail: '',
    phoneNumber: '',
    website: '',
    socialMedia: {
      instagram: '',
      linkedin: '',
      facebook: ''
    },
    bio: '',
    profilePhoto: '',
    verificationDocuments: [],
    isVerified: false
  });

  // Additional user profile fields
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    age: 0,
    bio: '',
    city: '',
    photos: [] as string[]
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [newDocument, setNewDocument] = useState<File | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadMatchmakerInfo();
    }
  }, [currentUser]);

  const loadMatchmakerInfo = async () => {
    try {
      if (!currentUser) return;

      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Load MatchMaker-specific info
        if (userData.matchmakerInfo) {
          setMatchmakerInfo(userData.matchmakerInfo);
        } else {
          // If no matchmakerInfo exists, create it from the main user data
          setMatchmakerInfo({
            businessName: userData.businessName || '',
            licenseNumber: userData.licenseNumber || '',
            experience: userData.experience || 0,
            specialties: userData.specialties || [],
            contactEmail: userData.contactEmail || '',
            phoneNumber: userData.phoneNumber || '',
            website: userData.website || '',
            socialMedia: userData.socialMedia || {
              instagram: '',
              linkedin: '',
              facebook: ''
            },
            bio: userData.professionalBio || userData.bio || '',
            profilePhoto: userData.photos?.[0] || '',
            verificationDocuments: userData.verificationDocuments || [],
            isVerified: userData.isMatchmakerVerified || false
          });
        }
        
        // Load basic user profile data
        setUserProfile({
          firstName: userData.firstName || '',
          middleName: userData.middleName || '',
          lastName: userData.lastName || '',
          age: userData.age || 0,
          bio: userData.bio || '',
          city: userData.city || '',
          photos: userData.photos || []
        });
      }
    } catch (error) {
      console.error('Error loading matchmaker info:', error);
      toast({
        title: "Error",
        description: "Failed to load matchmaker information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        matchmakerInfo: matchmakerInfo,
        role: 'matchmaker',
        // Update basic user profile fields
        firstName: userProfile.firstName,
        middleName: userProfile.middleName,
        lastName: userProfile.lastName,
        age: userProfile.age,
        bio: userProfile.bio,
        city: userProfile.city,
        photos: userProfile.photos,
        // Update MatchMaker fields directly in user document
        businessName: matchmakerInfo.businessName,
        licenseNumber: matchmakerInfo.licenseNumber,
        experience: matchmakerInfo.experience,
        specialties: matchmakerInfo.specialties,
        contactEmail: matchmakerInfo.contactEmail,
        phoneNumber: matchmakerInfo.phoneNumber,
        website: matchmakerInfo.website,
        socialMedia: matchmakerInfo.socialMedia,
        professionalBio: matchmakerInfo.bio,
        verificationDocuments: matchmakerInfo.verificationDocuments
      });

      toast({
        title: "Success",
        description: "Matchmaker profile updated successfully!",
      });
    } catch (error) {
      console.error('Error saving matchmaker info:', error);
      toast({
        title: "Error",
        description: "Failed to save matchmaker information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !matchmakerInfo.specialties.includes(newSpecialty.trim())) {
      setMatchmakerInfo(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setMatchmakerInfo(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewDocument(file);
      // Here you would typically upload to Firebase Storage
      // For now, we'll just add the file name
      setMatchmakerInfo(prev => ({
        ...prev,
        verificationDocuments: [...(prev.verificationDocuments || []), file.name]
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Loading matchmaker profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">MatchMaker Profile</h1>
              <p className="text-gray-600">Set up your professional matchmaking profile</p>
            </div>
          </div>
          
          {matchmakerInfo.isVerified && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-800 font-medium">Verified MatchMaker</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Your profile has been verified and you can now upload profiles with verification badges.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Photo */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Profile Photo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Avatar className="h-32 w-32 mx-auto mb-4">
                    <AvatarImage src={matchmakerInfo.profilePhoto} />
                    <AvatarFallback>
                      <Building className="h-16 w-16" />
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={userProfile.firstName}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={userProfile.middleName}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, middleName: e.target.value }))}
                      placeholder="Enter your middle name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={userProfile.lastName}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      value={userProfile.age}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter your age"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={userProfile.city}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter your city"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="personalBio">Personal Bio</Label>
                  <Textarea
                    id="personalBio"
                    value={userProfile.bio}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={matchmakerInfo.businessName}
                      onChange={(e) => setMatchmakerInfo(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Enter your business name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={matchmakerInfo.licenseNumber}
                      onChange={(e) => setMatchmakerInfo(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      placeholder="Enter license number (optional)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experience">Years of Experience *</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={matchmakerInfo.experience}
                      onChange={(e) => setMatchmakerInfo(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter years of experience"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={matchmakerInfo.contactEmail}
                      onChange={(e) => setMatchmakerInfo(prev => ({ ...prev, contactEmail: e.target.value }))}
                      placeholder="Enter contact email"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={matchmakerInfo.phoneNumber}
                    onChange={(e) => setMatchmakerInfo(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="Enter phone number (optional)"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Professional Bio *</Label>
                  <Textarea
                    id="bio"
                    value={matchmakerInfo.bio}
                    onChange={(e) => setMatchmakerInfo(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about your matchmaking experience and approach..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Specialties */}
            <Card>
              <CardHeader>
                <CardTitle>Specialties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="Add a specialty"
                    onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
                  />
                  <Button onClick={addSpecialty} disabled={!newSpecialty.trim()}>
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {matchmakerInfo.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <span>{specialty}</span>
                      <button
                        onClick={() => removeSpecialty(specialty)}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={matchmakerInfo.website}
                    onChange={(e) => setMatchmakerInfo(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="Enter website URL (optional)"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Social Media</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="instagram" className="flex items-center space-x-2">
                        <Instagram className="h-4 w-4" />
                        <span>Instagram</span>
                      </Label>
                      <Input
                        id="instagram"
                        value={matchmakerInfo.socialMedia?.instagram || ''}
                        onChange={(e) => setMatchmakerInfo(prev => ({ 
                          ...prev, 
                          socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                        }))}
                        placeholder="@username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin" className="flex items-center space-x-2">
                        <Linkedin className="h-4 w-4" />
                        <span>LinkedIn</span>
                      </Label>
                      <Input
                        id="linkedin"
                        value={matchmakerInfo.socialMedia?.linkedin || ''}
                        onChange={(e) => setMatchmakerInfo(prev => ({ 
                          ...prev, 
                          socialMedia: { ...prev.socialMedia, linkedin: e.target.value }
                        }))}
                        placeholder="LinkedIn URL"
                      />
                    </div>
                    <div>
                      <Label htmlFor="facebook" className="flex items-center space-x-2">
                        <Facebook className="h-4 w-4" />
                        <span>Facebook</span>
                      </Label>
                      <Input
                        id="facebook"
                        value={matchmakerInfo.socialMedia?.facebook || ''}
                        onChange={(e) => setMatchmakerInfo(prev => ({ 
                          ...prev, 
                          socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                        }))}
                        placeholder="Facebook URL"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Verification Documents</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="documents">Upload Documents</Label>
                  <Input
                    id="documents"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleDocumentUpload}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload business license, certifications, or other verification documents
                  </p>
                </div>

                {matchmakerInfo.verificationDocuments && matchmakerInfo.verificationDocuments.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Uploaded Documents:</h4>
                    <div className="space-y-2">
                      {matchmakerInfo.verificationDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span>{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchMakerProfile;
