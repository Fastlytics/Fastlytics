import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toast } from 'sonner';
import { m } from 'motion/react';
import { Camera01Icon, Cancel01Icon, Upload04Icon } from 'hugeicons-react';
import { Dialog } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getAccessToken } from '@/lib/supabase';
import { resolveUploadUrl } from '@/lib/upload-url';
import { cn } from '@/lib/utils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.fastlytics.app';

interface ProfilePictureUploadProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (url: string) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const outputSize = 400; // Output a 400x400 avatar
  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      },
      'image/jpeg',
      0.9
    );
  });
}

export function ProfilePictureUpload({ open, onClose, onSuccess }: ProfilePictureUploadProps) {
  const { profile, refreshProfile } = useAuth();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isUploading, setIsUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  const handleUpload = async () => {
    if (!imgRef.current || !completedCrop || !profile?.username) {
      toast.error('Please select and crop an image first');
      return;
    }

    setIsUploading(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      const token = await getAccessToken();
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/uploads/avatar?username=${encodeURIComponent(profile.username)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'image/jpeg',
            Authorization: `Bearer ${token}`,
          },
          body: blob,
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      const avatarUrl = resolveUploadUrl(data.url);

      if (!avatarUrl) {
        throw new Error('Upload succeeded but no avatar URL was returned');
      }

      // Update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Profile picture updated');
      await refreshProfile();
      onSuccess?.(avatarUrl);
      handleClose();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} className="max-w-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-white">Upload Profile Picture</h2>
        <button
          onClick={handleClose}
          className="rounded-md p-1 text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <Cancel01Icon className="size-4" />
        </button>
      </div>

      <p className="mt-1 text-[12px] text-white/50">
        Choose a photo and crop it to a square. Max 5MB after crop.
      </p>

      <div className="mt-4">
        {!selectedFile ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-white/[0.08] py-12',
              'text-white/50 transition-colors hover:border-white/[0.16] hover:bg-white/[0.02] hover:text-white/70'
            )}
          >
            <Camera01Icon className="size-8" />
            <span className="text-[13px] font-medium">Click to select an image</span>
            <span className="text-[11px] text-white/40">JPG, PNG, or WebP up to 10MB</span>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center overflow-hidden rounded-lg bg-black/40">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  src={selectedFile}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  className="max-h-[300px] w-auto"
                />
              </ReactCrop>
            </div>

            <button
              onClick={() => {
                setSelectedFile(null);
                setCrop(undefined);
                setCompletedCrop(undefined);
              }}
              className="text-[12px] text-white/50 transition-colors hover:text-white"
            >
              Choose a different image
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          onClick={handleClose}
          disabled={isUploading}
          className="rounded-md border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={isUploading || !completedCrop || !selectedFile}
          className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-[12px] font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
        >
          <Upload04Icon className="size-3.5" />
          {isUploading ? 'Uploading…' : 'Set Profile Picture'}
        </button>
      </div>
    </Dialog>
  );
}
