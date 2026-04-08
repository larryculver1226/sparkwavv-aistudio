import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { useIdentity } from '../contexts/IdentityContext';

interface ProfileImageUploadProps {
  currentPhotoUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  className?: string;
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentPhotoUrl,
  onUploadSuccess,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useIdentity();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(0);

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const downloadURL = await storageService.uploadProfileImage(file, (p) => {
        setProgress(Math.round(p));
      });
      
      if (onUploadSuccess) {
        onUploadSuccess(downloadURL);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      setPreviewUrl(currentPhotoUrl || null); // Revert on failure
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        onClick={onClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center w-32 h-32 rounded-full border-2 border-dashed cursor-pointer overflow-hidden transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
        }`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500">
            <Upload className="w-8 h-8 mb-1" />
            <span className="text-xs text-center px-2">Upload Photo</span>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mb-1" />
            <span className="text-xs font-medium">{progress}%</span>
          </div>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        className="hidden"
      />

      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center">
          <X className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}
      
      <p className="mt-2 text-xs text-gray-500">
        Drag & drop or click to upload
      </p>
    </div>
  );
};
