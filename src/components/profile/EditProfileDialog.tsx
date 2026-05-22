import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { m, AnimatePresence } from 'motion/react';
import { Camera01Icon } from 'hugeicons-react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { updateMyProfile } from '@/lib/profile-api';
import { resolveUploadUrl } from '@/lib/upload-url';
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload';
import {
  fetchDriverStandings,
  fetchTeamStandings,
  type DriverStanding,
  type TeamStanding,
} from '@/lib/api';
import { getTeamLogo } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { resolveSeasonYear } from '@/lib/seasonUtils';
import { toast } from 'sonner';

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

export function EditProfileDialog({ open, onClose }: EditProfileDialogProps) {
  const { profile, user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    bio: '',
    favorite_driver: '',
    favorite_team: '',
    is_public: true,
  });

  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [teams, setTeams] = useState<TeamStanding[]>([]);
  const [seasonYear, setSeasonYear] = useState(2025);
  const [loadingF1, setLoadingF1] = useState(true);

  useEffect(() => {
    if (open && profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        favorite_driver: profile.favorite_driver || '',
        favorite_team: profile.favorite_team || '',
        is_public: profile.is_public,
      });
    }
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;
    const loadF1Data = async () => {
      try {
        const resolvedYear = await resolveSeasonYear(fetchDriverStandings);
        setSeasonYear(resolvedYear);
        const [d, t] = await Promise.all([
          fetchDriverStandings(resolvedYear),
          fetchTeamStandings(resolvedYear),
        ]);
        setDrivers(d);
        setTeams(t);
      } catch {
        toast.error('Failed to load F1 data');
      } finally {
        setLoadingF1(false);
      }
    };
    loadF1Data();
  }, [open]);

  const computedFullName = `${form.first_name || ''} ${form.last_name || ''}`.trim() || null;

  const hasChanges = profile
    ? form.first_name !== (profile.first_name || '') ||
      form.last_name !== (profile.last_name || '') ||
      form.username !== (profile.username || '') ||
      form.bio !== (profile.bio || '') ||
      form.favorite_driver !== (profile.favorite_driver || '') ||
      form.favorite_team !== (profile.favorite_team || '') ||
      form.is_public !== profile.is_public
    : false;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload: Record<string, string | boolean | null> = {};

      const prevFirstName = profile?.first_name || '';
      const prevLastName = profile?.last_name || '';

      if (form.first_name !== prevFirstName || form.last_name !== prevLastName) {
        payload.first_name = form.first_name || null;
        payload.last_name = form.last_name || null;
        payload.full_name = computedFullName;
      }
      if (form.username !== (profile?.username || '')) {
        payload.username = form.username || null;
      }
      if (form.bio !== (profile?.bio || '')) {
        payload.bio = form.bio || null;
      }
      if (form.favorite_driver !== (profile?.favorite_driver || '')) {
        payload.favorite_driver = form.favorite_driver || null;
      }
      if (form.favorite_team !== (profile?.favorite_team || '')) {
        payload.favorite_team = form.favorite_team || null;
      }
      if (form.is_public !== (profile?.is_public ?? true)) {
        payload.is_public = form.is_public;
      }

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      await updateMyProfile(payload);
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['publicProfile'] });
      toast.success('Profile updated');
      onClose();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const displayName = computedFullName || form.username || 'User';
  const avatarUrl = profile?.avatar_url ? resolveUploadUrl(profile.avatar_url) : null;

  const inputClass =
    'h-9 border-white/[0.08] bg-white/[0.03] text-[13px] text-white placeholder:text-white/30 focus-visible:ring-white/20';

  const selectedDriver = drivers.find((d) => d.code === form.favorite_driver);
  const selectedTeam = teams.find((t) => t.team === form.favorite_team);

  return (
    <>
      <Dialog open={open} onClose={onClose} className="max-w-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-white">Edit profile</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <button onClick={() => setAvatarDialogOpen(true)} className="group relative">
              <Avatar className="size-20 border border-white/[0.1]">
                <AvatarImage src={avatarUrl ?? undefined} className="object-cover" />
                <AvatarFallback className="bg-white/[0.06] text-[20px] font-medium text-white">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera01Icon className="size-5 text-white" />
              </div>
            </button>
          </div>

          {/* First name + Last name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-white/60">First name</label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                placeholder="First name"
                maxLength={50}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-white/60">Last name</label>
              <Input
                value={form.last_name}
                onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                placeholder="Last name"
                maxLength={50}
                className={inputClass}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-white/60">Username</label>
            <Input
              value={form.username}
              onChange={(e) => {
                const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                setForm((p) => ({ ...p, username: sanitized }));
              }}
              placeholder="username"
              maxLength={30}
              className={inputClass}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-white/60">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Tell us about yourself"
              maxLength={160}
              rows={2}
              className="w-full resize-none rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            />
          </div>

          {/* Favorite driver + Favorite team */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-white/60">
                Favorite driver
              </label>
              {loadingF1 ? (
                <div className="h-9 animate-pulse rounded-md bg-white/[0.03]" />
              ) : (
                <PickerDropdown
                  trigger={
                    selectedDriver ? (
                      <span className="flex items-center gap-2 truncate">
                        <img
                          src={getDriverImage(selectedDriver.code, seasonYear)}
                          alt=""
                          className="size-5 shrink-0 rounded-full object-cover object-top"
                        />
                        <span className="truncate text-[13px]">{selectedDriver.name}</span>
                      </span>
                    ) : (
                      <span className="text-[13px] text-white/30">None</span>
                    )
                  }
                >
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, favorite_driver: '' }))}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] transition-colors',
                      !form.favorite_driver
                        ? 'bg-white/[0.04] text-white'
                        : 'text-white/80 hover:bg-white/[0.03] hover:text-white'
                    )}
                  >
                    <span className="size-5 rounded-full bg-white/[0.04]" />
                    <span>None</span>
                  </button>
                  {drivers.map((d) => {
                    const isSelected = form.favorite_driver === d.code;
                    const img = getDriverImage(d.code, seasonYear);
                    return (
                      <button
                        key={d.code}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, favorite_driver: isSelected ? '' : d.code }))
                        }
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] transition-colors',
                          isSelected
                            ? 'bg-white/[0.04] text-white'
                            : 'text-white/80 hover:bg-white/[0.03] hover:text-white'
                        )}
                      >
                        {img ? (
                          <img
                            src={img}
                            alt=""
                            className="size-5 shrink-0 rounded-full object-cover object-top"
                          />
                        ) : (
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[9px] text-white/60">
                            {d.name.charAt(0)}
                          </span>
                        )}
                        <span className="truncate">{d.name}</span>
                      </button>
                    );
                  })}
                </PickerDropdown>
              )}
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-white/60">
                Favorite team
              </label>
              {loadingF1 ? (
                <div className="h-9 animate-pulse rounded-md bg-white/[0.03]" />
              ) : (
                <PickerDropdown
                  trigger={
                    selectedTeam ? (
                      <span className="flex items-center gap-2">
                        <img
                          src={getTeamLogo(selectedTeam.team) || ''}
                          alt=""
                          className="size-5 object-contain"
                        />
                        <span className="text-[13px] truncate">{selectedTeam.team}</span>
                      </span>
                    ) : (
                      <span className="text-[13px] text-white/30">None</span>
                    )
                  }
                >
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, favorite_team: '' }))}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] transition-colors',
                      !form.favorite_team
                        ? 'bg-white/[0.04] text-white'
                        : 'text-white/80 hover:bg-white/[0.03] hover:text-white'
                    )}
                  >
                    <span className="size-5" />
                    <span>None</span>
                  </button>
                  {teams.map((t) => {
                    const isSelected = form.favorite_team === t.team;
                    const logo = getTeamLogo(t.team);
                    return (
                      <button
                        key={t.team}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, favorite_team: isSelected ? '' : t.team }))
                        }
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] transition-colors',
                          isSelected
                            ? 'bg-white/[0.04] text-white'
                            : 'text-white/80 hover:bg-white/[0.03] hover:text-white'
                        )}
                      >
                        {logo ? (
                          <img src={logo} alt="" className="size-5 object-contain" />
                        ) : (
                          <span className="size-5" />
                        )}
                        <span>{t.team}</span>
                      </button>
                    );
                  })}
                </PickerDropdown>
              )}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-white/60">Visibility</label>
            <PickerDropdown
              trigger={<span className="text-[13px]">{form.is_public ? 'Public' : 'Private'}</span>}
            >
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, is_public: true }))}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] transition-colors',
                  form.is_public
                    ? 'bg-white/[0.04] text-white'
                    : 'text-white/80 hover:bg-white/[0.03] hover:text-white'
                )}
              >
                <div>
                  <div className="font-medium">Public</div>
                  <div className="text-[11px] text-white/40">Everyone can see your profile</div>
                </div>
                {form.is_public && <span className="size-1.5 shrink-0 rounded-full bg-white/60" />}
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, is_public: false }))}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] transition-colors',
                  !form.is_public
                    ? 'bg-white/[0.04] text-white'
                    : 'text-white/80 hover:bg-white/[0.03] hover:text-white'
                )}
              >
                <div>
                  <div className="font-medium">Private</div>
                  <div className="text-[11px] text-white/40">Only basic info is shown</div>
                </div>
                {!form.is_public && <span className="size-1.5 shrink-0 rounded-full bg-white/60" />}
              </button>
            </PickerDropdown>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white/70 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={cn(
              'rounded-md px-4 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-50',
              'bg-white text-black hover:bg-white/90'
            )}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Dialog>

      <ProfilePictureUpload
        open={avatarDialogOpen}
        onClose={() => setAvatarDialogOpen(false)}
        onSuccess={() => {
          refreshProfile();
          queryClient.invalidateQueries({ queryKey: ['publicProfile'] });
        }}
      />
    </>
  );
}

// ─── Picker dropdown (matching BreadcrumbBar season picker) ────────────────

function PickerDropdown({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-all h-9',
          open
            ? 'border-white/[0.08] bg-white/[0.04] text-white'
            : 'border-white/[0.08] bg-white/[0.03] text-white hover:border-white/[0.12]'
        )}
      >
        {trigger}
        <svg
          width="8"
          height="8"
          viewBox="0 0 10 10"
          fill="none"
          className={`shrink-0 text-white/60 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M2 4l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[160px] overflow-hidden rounded-lg border border-white/[0.04] bg-[#0a0a0a] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          >
            <div className="p-1">{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
