import React, { useState } from 'react';
import type { User } from '../../types';

interface ExpandedProfileProps {
  user: User;
  onClose: () => void;
  onLike: () => void;
  onPass: () => void;
  loading?: boolean;
}

const ExpandedProfile: React.FC<ExpandedProfileProps> = ({ 
  user, 
  onClose, 
  onLike, 
  onPass, 
  loading = false 
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === user.photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === 0 ? user.photos.length - 1 : prev - 1
    );
  };

  // Mock additional user data for demo purposes
  const additionalInfo = {
    hobbies: ['Photography', 'Hiking', 'Cooking', 'Travel', 'Reading', 'Yoga'],
    education: 'Bachelor\'s in Computer Science',
    occupation: 'Software Engineer',
    height: '5\'8"',
    relationshipStatus: 'Single',
    lookingFor: 'Long-term relationship',
    lifestyle: ['Non-smoker', 'Occasionally drinks', 'Vegetarian'],
    personality: ['Adventurous', 'Creative', 'Optimistic', 'Independent'],
    dealBreakers: ['Smoking', 'Not interested in travel'],
    funFacts: [
      'I\'ve visited 15 countries',
      'I can speak 3 languages',
      'I love trying new cuisines',
      'I\'m a morning person'
    ]
  };

  return (
    <div className="w-full min-h-[600px] bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header with close button */}
      <div className="relative p-4 border-b border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 p-2 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main content area */}
      <div className="flex h-full">
        {/* Left side - Profile photo */}
        <div className="w-48 flex-shrink-0 p-4 mr-8">
          <div className="relative h-64 rounded-xl overflow-hidden bg-gray-200">
            {user.photos.length > 0 ? (
              <>
                <img
                  src={user.photos[currentPhotoIndex]}
                  alt={`${user.name} photo ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Photo indicators */}
                {user.photos.length > 1 && (
                  <div className="absolute top-2 left-2 flex space-x-1">
                    {user.photos.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Navigation arrows */}
                {user.photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">No photos</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Right below profile picture */}
          <div className="mt-4">
            <div className="flex space-x-3">
              <button
                onClick={onPass}
                disabled={loading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-full transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Pass
              </button>

              <button
                onClick={onLike}
                disabled={loading}
                className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-full transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                Like
              </button>
            </div>
          </div>
        </div>

        {/* Right side - Detailed content */}
        <div className="flex-1 p-6 pl-0 overflow-y-auto">
          {/* Basic Info */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
            <div className="flex items-center space-x-4 text-gray-600 mb-4">
              <span className="text-xl">{user.age}</span>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{user.city}</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">About Me</h3>
              <p className="text-gray-700 leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Grid Layout for Additional Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Hobbies */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Hobbies & Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {additionalInfo.hobbies.map((hobby, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lifestyle */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Lifestyle</h3>
                <div className="space-y-2">
                  {additionalInfo.lifestyle.map((item, index) => (
                    <div key={index} className="flex items-center text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Personality */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personality</h3>
                <div className="flex flex-wrap gap-2">
                  {additionalInfo.personality.map((trait, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Basic Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Details</h3>
                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between">
                    <span className="font-medium">Education:</span>
                    <span>{additionalInfo.education}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Occupation:</span>
                    <span>{additionalInfo.occupation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Height:</span>
                    <span>{additionalInfo.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Looking for:</span>
                    <span>{additionalInfo.lookingFor}</span>
                  </div>
                </div>
              </div>

              {/* Fun Facts */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Fun Facts</h3>
                <div className="space-y-2">
                  {additionalInfo.funFacts.map((fact, index) => (
                    <div key={index} className="flex items-start text-gray-700">
                      <span className="text-primary-500 mr-2">•</span>
                      <span>{fact}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deal Breakers */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Deal Breakers</h3>
                <div className="space-y-2">
                  {additionalInfo.dealBreakers.map((breaker, index) => (
                    <div key={index} className="flex items-center text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      {breaker}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Original Interests */}
          {user.interests.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpandedProfile;
