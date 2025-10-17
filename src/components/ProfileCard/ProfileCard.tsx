import React, { useState } from 'react';
import type { User } from '../../types';

interface ProfileCardProps {
  user: User;
  onLike: () => void;
  onPass: () => void;
  loading?: boolean;
  onExpand?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, onLike, onPass, loading = false, onExpand }) => {
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

  return (
    <div 
      className="relative w-full max-w-sm mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden cursor-pointer lg:hover:shadow-3xl transition-all duration-500 ease-in-out"
      onClick={onExpand}
    >
      {/* Photo carousel */}
      <div className="relative h-96 bg-gray-200">
        {user.photos.length > 0 ? (
          <>
            <img
              src={user.photos[currentPhotoIndex]}
              alt={`${user.name} photo ${currentPhotoIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Photo indicators */}
            {user.photos.length > 1 && (
              <div className="absolute top-4 left-4 flex space-x-2">
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
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <p>No photos</p>
            </div>
          </div>
        )}
      </div>

      {/* Profile info */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
          <span className="text-lg text-gray-600">{user.age}</span>
        </div>

        <div className="flex items-center text-gray-600 mb-4">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{user.city}</span>
        </div>

        {user.bio && (
          <p className="text-gray-700 mb-4 leading-relaxed">{user.bio}</p>
        )}

        {user.interests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {user.interests.slice(0, 6).map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                >
                  {interest}
                </span>
              ))}
              {user.interests.length > 6 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  +{user.interests.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

            {/* Action buttons */}
            <div className="flex space-x-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPass();
                }}
                disabled={loading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-full transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Pass
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike();
                }}
                disabled={loading}
                className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                Like
              </button>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="mt-4 text-center text-sm text-gray-500">
              <p className="lg:hidden">Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">J</kbd> to pass or <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">L</kbd> to like</p>
              <p className="hidden lg:block">Click anywhere to see more details</p>
            </div>
      </div>
    </div>
  );
};

export default ProfileCard;
