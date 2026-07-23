import { Save, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export function Profile() {
  return (
    <div className="p-10">
      <div className="mb-10">
        <h1 className="text-gray-900 dark:text-white mb-2">Profile</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account settings and preferences.</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Profile Picture */}
        <Card className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">Profile Picture</CardTitle>
            <CardDescription className="dark:text-gray-400">Update your profile photo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-gray-100 dark:border-gray-800 shadow-sm">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline" className="gap-2 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                  <Upload className="w-4 h-4" />
                  Upload New Photo
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG or GIF. Max size 2MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">Personal Information</CardTitle>
            <CardDescription className="dark:text-gray-400">Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm text-gray-700 dark:text-gray-300">First Name</Label>
                <Input id="firstName" placeholder="John" className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm text-gray-700 dark:text-gray-300">Last Name</Label>
                <Input id="lastName" placeholder="Doe" className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-700 dark:text-gray-300">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm text-gray-700 dark:text-gray-300">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                rows={4}
                className="border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">Account Settings</CardTitle>
            <CardDescription className="dark:text-gray-400">Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm text-gray-700 dark:text-gray-300">Current Password</Label>
              <Input id="currentPassword" type="password" className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm text-gray-700 dark:text-gray-300">New Password</Label>
              <Input id="newPassword" type="password" className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm text-gray-700 dark:text-gray-300">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl" />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-md shadow-indigo-500/20">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}