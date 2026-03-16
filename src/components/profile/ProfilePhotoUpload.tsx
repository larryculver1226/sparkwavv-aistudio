import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Check, Upload, Loader2 } from 'lucide-react';
import { Button } from '../Button';

interface ProfilePhotoUploadProps {
  currentPhotoURL?: string;
  onSave: (blob: Blob) => Promise<void>;
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({ currentPhotoURL, onSave }) => {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImage(reader.result as string);
        setShowCropper(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('No 2d context');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleSave = async () => {
    if (!image || !croppedAreaPixels) return;

    try {
      setIsUploading(true);
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      await onSave(croppedBlob);
      setShowCropper(false);
      setImage(null);
    } catch (error) {
      console.error('Error cropping/saving image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-neon-cyan/20 bg-white/5 relative">
        <img 
          src={currentPhotoURL || "https://picsum.photos/seed/user/200"} 
          alt="Profile" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <Camera className="w-8 h-8 text-white mb-1" />
          <span className="text-[10px] text-white uppercase tracking-widest font-bold">Change</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
      </div>

      <AnimatePresence>
        {showCropper && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel max-w-2xl w-full p-8 space-y-8 border-neon-cyan/20"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-display font-bold">Crop Profile Photo</h3>
                <button onClick={() => setShowCropper(false)} className="text-white/40 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="relative h-[400px] w-full bg-black rounded-2xl overflow-hidden border border-white/10">
                <Cropper
                  image={image!}
                  crop={crop}
                  zoom={zoom}
                  aspect={1 / 1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="round"
                  showGrid={false}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Zoom</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-neon-cyan"
                  />
                </div>

                <div className="flex gap-4">
                  <Button 
                    variant="secondary" 
                    className="flex-1"
                    onClick={() => setShowCropper(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="neon" 
                    className="flex-1"
                    onClick={handleSave}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Save Photo</>}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
