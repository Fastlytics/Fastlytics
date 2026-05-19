import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Image01Icon, FolderOpenIcon, Cancel01Icon } from 'hugeicons-react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { resolveUploadUrl } from '@/lib/upload-url';

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (folder: { id: string; name: string; cover_image_url: string | null }) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.fastlytics.app';

export function CreateFolderDialog({ open, onClose, onSuccess }: CreateFolderDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user || !name.trim()) throw new Error('Name is required');

      // 1. Create the folder in Supabase
      const { data: folder, error } = await supabase
        .from('saved_folders')
        .insert({ name: name.trim(), user_id: user.id, is_public: false })
        .select('id, name')
        .single();

      if (error) throw error;

      let coverImageUrl: string | null = null;

      // 2. Upload cover image to R2 if provided
      if (imageFile) {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        const uploadResp = await fetch(
          `${API_BASE}/api/uploads/folder-cover?folder_id=${folder.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': imageFile.type,
              Authorization: `Bearer ${token}`,
            },
            body: imageFile,
          }
        );

        if (uploadResp.ok) {
          const result = await uploadResp.json();
          coverImageUrl = resolveUploadUrl(result.url);

          // 3. Update the folder with the cover image URL
          await supabase
            .from('saved_folders')
            .update({ cover_image_url: coverImageUrl })
            .eq('id', folder.id);
        }
      }

      return { id: folder.id, name: folder.name, cover_image_url: coverImageUrl };
    },
    onSuccess: (folder) => {
      onSuccess(folder);
      resetState();
    },
  });

  const resetState = () => {
    setName('');
    setImageFile(null);
    setImagePreview(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB limit

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <h2 className="text-[15px] font-semibold text-white">Create folder</h2>
      <p className="mt-1 text-[12px] text-white/60">Organize your saved charts into collections.</p>

      <div className="mt-5 space-y-4">
        {/* Folder name */}
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-white/70">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 2025 Season Analysis"
            className="h-9 border-white/[0.08] bg-white/[0.02] text-[13px] text-white placeholder:text-white/35 focus:border-white/[0.15] focus:ring-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) createMutation.mutate();
            }}
            autoFocus
          />
        </div>

        {/* Cover image */}
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-white/70">
            Cover image <span className="text-white/40">(optional)</span>
          </label>

          {imagePreview ? (
            <div className="relative overflow-hidden rounded-lg border border-white/[0.06]">
              <img src={imagePreview} alt="Cover preview" className="h-32 w-full object-cover" />
              <button
                onClick={removeImage}
                className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white/80 backdrop-blur-sm transition-colors hover:text-white"
              >
                <Cancel01Icon className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.08] transition-colors',
                'hover:border-white/[0.15] hover:bg-white/[0.01]'
              )}
            >
              <div className="flex size-8 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02]">
                <Image01Icon className="size-4 text-white/40" />
              </div>
              <span className="text-[11px] text-white/40">Click to upload an image</span>
              <span className="text-[10px] text-white/25">JPG, PNG, WebP · Max 5MB</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Error */}
      {createMutation.isError && (
        <p className="mt-3 text-[12px] text-red-400">
          {(createMutation.error as Error)?.message || 'Something went wrong'}
        </p>
      )}

      {/* Actions */}
      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          onClick={handleClose}
          disabled={createMutation.isPending}
          className="rounded-md border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={() => createMutation.mutate()}
          disabled={!name.trim() || createMutation.isPending}
          className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-[12px] font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-40"
        >
          <FolderOpenIcon className="size-3.5" />
          {createMutation.isPending ? 'Creating…' : 'Create folder'}
        </button>
      </div>
    </Dialog>
  );
}
