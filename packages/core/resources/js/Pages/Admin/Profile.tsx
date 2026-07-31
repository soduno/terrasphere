import { useState, useRef, useEffect, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Save, Upload } from 'lucide-react';
import { api, ApiError } from '@adapter/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { Textarea } from '@ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@ui/avatar';

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  profile_image_path: string | null;
}

interface PageProps {
  [key: string]: unknown;
  auth: {
    user: {
      uuid: string;
      username: string;
      email: string;
    };
  };
  profile?: ProfileData;
  success?: string;
  errors?: Record<string, string>;
}

function getInitials(firstName: string | null, lastName: string | null, fallback: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName[0].toUpperCase();
  }
  return fallback;
}

export default function Profile() {
  const { props } = usePage<PageProps>();
  const { auth, profile, success, errors: inertiaErrors } = props;

  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSavesRef = useRef(0);

  useEffect(() => {
    if (success) {
      toast.success(success);
    }
  }, [success]);

  const doSave = useCallback((partial?: Record<string, string | null>) => {
    activeSavesRef.current++;
    setSavingProfile(true);
    setProfileErrors({});
    api.put('/admin/profile', partial ?? {
      first_name: firstName || null,
      last_name: lastName || null,
      bio: bio || null,
    }).then(() => {
      toast.success('Changes saved successfully');
    }).catch((error: unknown) => {
      if (error instanceof ApiError && error.errors) {
        const mapped: Record<string, string> = {};
        for (const [key, messages] of Object.entries(error.errors)) {
          if (messages.length > 0) {
            mapped[key] = messages[0];
          }
        }
        setProfileErrors(mapped);
      }
    }).finally(() => {
      activeSavesRef.current--;
      setSavingProfile(activeSavesRef.current > 0);
    });
  }, [firstName, lastName, bio]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    doSave();
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    router.put('/admin/profile/password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: confirmPassword,
    }, {
      onFinish: () => setSavingPassword(false),
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      },
    });
  };

  const fieldErrorClass = (field: string) =>
    inertiaErrors?.[field] || profileErrors[field] ? 'border-red-500' : '';

  return (
    <div className="p-10">
      <div className="mb-10">
        <h1 className="text-gray-900 dark:text-white mb-2">Profile</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account settings and preferences.</p>
      </div>

      <div className="max-w-3xl space-y-6">
        <Card className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">Profile Picture</CardTitle>
            <CardDescription className="dark:text-gray-400">Update your profile photo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-gray-100 dark:border-gray-800 shadow-sm">
                <AvatarImage src={profile?.profile_image_path ?? undefined} />
                <AvatarFallback>{getInitials(profile?.first_name ?? null, profile?.last_name ?? null, auth.user.username.substring(0, 2).toUpperCase())}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Upload New Photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/gif"
                  className="hidden"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG or GIF. Max size 2MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSaveProfile}>
          <Card className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="dark:text-white">Personal Information</CardTitle>
              <CardDescription className="dark:text-gray-400">Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm text-gray-700 dark:text-gray-300">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => doSave({ first_name: firstName || null })}
                    className={`h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl ${fieldErrorClass('first_name')}`}
                  />
                  {(inertiaErrors?.first_name || profileErrors.first_name) && (
                    <p className="text-xs text-red-500">{profileErrors.first_name || inertiaErrors?.first_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm text-gray-700 dark:text-gray-300">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => doSave({ last_name: lastName || null })}
                    className={`h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl ${fieldErrorClass('last_name')}`}
                  />
                  {(inertiaErrors?.last_name || profileErrors.last_name) && (
                    <p className="text-xs text-red-500">{profileErrors.last_name || inertiaErrors?.last_name}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-gray-700 dark:text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={auth.user.email}
                  disabled
                  className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl opacity-60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm text-gray-700 dark:text-gray-300">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  onBlur={() => doSave({ bio: bio || null })}
                  className={`border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl resize-none ${fieldErrorClass('bio')}`}
                />
                {(inertiaErrors?.bio || profileErrors.bio) && (
                  <p className="text-xs text-red-500">{profileErrors.bio || inertiaErrors?.bio}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end mt-4">
            <Button
              type="submit"
              disabled={savingProfile}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-blue-300 shadow-md shadow-indigo-500/20"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        <form onSubmit={handleSavePassword}>
          <Card className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="dark:text-white">Account Settings</CardTitle>
              <CardDescription className="dark:text-gray-400">Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm text-gray-700 dark:text-gray-300">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl ${inertiaErrors?.current_password ? 'border-red-500' : ''}`}
                />
                {inertiaErrors?.current_password && (
                  <p className="text-xs text-red-500">{inertiaErrors.current_password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm text-gray-700 dark:text-gray-300">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl ${inertiaErrors?.new_password ? 'border-red-500' : ''}`}
                />
                {inertiaErrors?.new_password && (
                  <p className="text-xs text-red-500">{inertiaErrors.new_password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm text-gray-700 dark:text-gray-300">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl ${inertiaErrors?.new_password_confirmation ? 'border-red-500' : ''}`}
                />
                {inertiaErrors?.new_password_confirmation && (
                  <p className="text-xs text-red-500">{inertiaErrors.new_password_confirmation}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end mt-4">
            <Button
              type="submit"
              disabled={savingPassword}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-blue-300 shadow-md shadow-indigo-500/20"
            >
              <Save className="w-4 h-4" />
              {savingPassword ? 'Saving...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
