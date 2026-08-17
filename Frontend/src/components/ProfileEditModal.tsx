import { useEffect, useRef, useState } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/auth';
import { getProfile, updateProfile } from '@/lib/api';

export function ProfileEditModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset fields each time the modal opens
  useEffect(() => {
    if (!open) return;
    setName(profile?.full_name ?? '');
    setBio(profile?.bio ?? '');
    setProfilePic(null);
    setPreviewUrl(profile?.avatar_url ?? null);
    // Load latest phone from the backend profile
    getProfile()
      .then((res: any) => res?.user?.phone && setPhone(res.user.phone))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleFile = (file: File) => {
    setProfilePic(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const save = async () => {
    if (!name.trim()) { toast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        phone: phone.trim() || undefined,
        profilePic,
      });
      await refreshProfile();
      toast('Profile updated', 'success');
      onClose();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to update profile', 'error');
    }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      {open && (
        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="group relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-ink-200 bg-ink-50 transition hover:border-brand-400"
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-ink-950/40 opacity-0 transition group-hover:opacity-100">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                </>
              ) : (
                <div className="text-ink-400">
                  <Upload className="mx-auto h-5 w-5" />
                  <p className="mt-1 text-[10px]">Upload</p>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-900">Profile photo</p>
              <p className="text-xs text-ink-500">Click the avatar to upload a new image.</p>
            </div>
            {previewUrl && profilePic && (
              <button onClick={() => { setPreviewUrl(profile?.avatar_url ?? null); setProfilePic(null); }} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-red-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          <div>
            <label className="label" htmlFor="profile-name">Full name</label>
            <input id="profile-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>

          <div>
            <label className="label" htmlFor="profile-phone">Phone</label>
            <input id="profile-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
          </div>

          <div>
            <label className="label" htmlFor="profile-bio">Bio</label>
            <textarea
              id="profile-bio"
              className="input min-h-20 resize-none"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community a little about yourself..."
            />
          </div>

<div className="flex justify-end gap-2 border-t border-ink-200 pt-4">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={save} className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

