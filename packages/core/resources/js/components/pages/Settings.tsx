import { Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';

export function Settings() {
  return (
    <div className="p-10">
      <div className="mb-10">
        <h1 className="text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your CMS configuration and preferences.</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* General Settings */}
        <Card className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">General Settings</CardTitle>
            <CardDescription className="dark:text-gray-400">Update your site's basic information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName" className="text-sm text-gray-700 dark:text-gray-300">Site Name</Label>
              <Input id="siteName" placeholder="ContentFlow CMS" className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteUrl" className="text-sm text-gray-700 dark:text-gray-300">Site URL</Label>
              <Input id="siteUrl" placeholder="https://example.com" className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm text-gray-700 dark:text-gray-300">Site Description</Label>
              <Input id="description" placeholder="A modern content management system" className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl" />
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">SEO Settings</CardTitle>
            <CardDescription className="dark:text-gray-400">Configure search engine optimization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle" className="text-sm text-gray-700 dark:text-gray-300">Default Meta Title</Label>
              <Input id="metaTitle" placeholder="ContentFlow - Modern CMS" className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription" className="text-sm text-gray-700 dark:text-gray-300">Default Meta Description</Label>
              <Input
                id="metaDescription"
                placeholder="Build beautiful websites with our modern CMS"
                className="h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl"
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label className="text-sm text-gray-700 dark:text-gray-300">Enable SEO Optimization</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Automatically optimize content for search engines</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">Performance</CardTitle>
            <CardDescription className="dark:text-gray-400">Optimize your site's performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label className="text-sm text-gray-700 dark:text-gray-300">Enable Caching</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cache pages for faster loading times</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-gray-100 dark:bg-gray-800" />
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label className="text-sm text-gray-700 dark:text-gray-300">Image Optimization</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Automatically compress and optimize images</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-gray-100 dark:bg-gray-800" />
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label className="text-sm text-gray-700 dark:text-gray-300">Lazy Loading</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Load images only when they're visible</p>
              </div>
              <Switch defaultChecked />
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