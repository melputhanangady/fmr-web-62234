import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { compressImage, shouldCompressImage } from '../../utils/imageCompression';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import { isDemoMode } from '../../utils/demoMode';

interface PhotoUploadProps {
  onPhotosChange: (urls: string[]) => void;
  maxPhotos?: number;
  currentPhotos?: string[];
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  onPhotosChange, 
  maxPhotos = 6, 
  currentPhotos = [] 
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const totalPhotos = currentPhotos.length + newFiles.length;

    if (totalPhotos > maxPhotos) {
      toast({
        title: "Too Many Photos",
        description: `You can only upload up to ${maxPhotos} photos`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = newFiles.map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Please select image files only');
        }

        // Validate file size (max 2MB for better performance)
        if (file.size > 2 * 1024 * 1024) {
          throw new Error('File size must be less than 2MB for better performance');
        }

        // Compress image if needed to reduce file size
        let processedFile: File;
        if (shouldCompressImage(file)) {
          const compressedDataUrl = await compressImage(file);
          // Convert data URL back to File for Firebase upload
          const response = await fetch(compressedDataUrl);
          processedFile = await response.blob() as File;
        } else {
          processedFile = file;
        }

        // Upload to Firebase Storage if not in demo mode
        if (!isDemoMode()) {
          const timestamp = Date.now();
          const fileName = `photo_${timestamp}_${Math.random().toString(36).substring(2)}.jpg`;
          const storageRef = ref(storage, `users/${fileName}`);
          
          await uploadBytes(storageRef, processedFile);
          const downloadURL = await getDownloadURL(storageRef);
          return downloadURL;
        } else {
          // Demo mode: convert to data URL
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve(e.target?.result as string);
            };
            reader.readAsDataURL(processedFile);
          });
        }
      });

      const newUrls = await Promise.all(uploadPromises);
      onPhotosChange([...currentPhotos, ...newUrls]);
      toast({
        title: "Success",
        description: `${newUrls.length} photo(s) uploaded successfully!`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || 'Failed to upload photos',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = currentPhotos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {currentPhotos.map((photo, index) => (
          <div key={index} className="relative group">
            <img
              src={photo}
              alt={`Photo ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              onClick={() => removePhoto(index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        ))}
        
        {currentPhotos.length < maxPhotos && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl text-gray-400 mb-2">+</div>
              <p className="text-sm text-gray-500">Add Photo</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={uploading}
      />

      {uploading && (
        <div className="text-center text-primary-500">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          <p className="mt-2">Uploading photos...</p>
        </div>
      )}

      <p className="text-sm text-gray-500">
        Upload {maxPhotos - currentPhotos.length} more photo{maxPhotos - currentPhotos.length !== 1 ? 's' : ''} 
        ({currentPhotos.length}/{maxPhotos})
      </p>
    </div>
  );
};

export default PhotoUpload;
