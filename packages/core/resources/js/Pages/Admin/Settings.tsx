import { useState, useRef, useEffect, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { api, ApiError } from '@adapter/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { Switch } from '@ui/switch';
import { Separator } from '@ui/separator';

interface SettingsData {
  site_name: string;
  site_url: string;
  site_description: string;
  meta_title: string;
  meta_description: string;
  enable_seo: boolean;
  enable_caching: boolean;
  enable_image_optimization: boolean;
  enable_lazy_loading: boolean;
}

interface PageProps {
  [key: string]: unknown;
  settings: SettingsData;
  success?: string;
}

export default function Settings() {
  const { props } = usePage<PageProps>();
  const { settings, success } = props;

  const [siteName, setSiteName] = useState(settings.site_name);
  const [siteUrl, setSiteUrl] = useState(settings.site_url);
  const [siteDescription, setSiteDescription] = useState(settings.site_description);
  const [metaTitle, setMetaTitle] = useState(settings.meta_title);
  const [metaDescription, setMetaDescription] = useState(settings.meta_description);
  const [enableSeo, setEnableSeo] = useState(settings.enable_seo);
  const [enableCaching, setEnableCaching] = useState(settings.enable_caching);
  const [enableImageOptimization, setEnableImageOptimization] = useState(settings.enable_image_optimization);
  const [enableLazyLoading, setEnableLazyLoading] = useState(settings.enable_lazy_loading);

  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const activeSavesRef = useRef(0);

  useEffect(() => {
    if (success) {
      toast.success(success);
    }
  }, [success]);

  const doSave = useCallback((partial?: Record<string, unknown>) => {
    activeSavesRef.current++;
    setSaving(true);
    setFieldErrors({});
    const data: Record<string, unknown> = partial ?? {
      site_name: siteName,
      site_url: siteUrl,
      site_description: siteDescription,
      meta_title: metaTitle,
      meta_description: metaDescription,
      enable_seo: enableSeo,
      enable_caching: enableCaching,
      enable_image_optimization: enableImageOptimization,
      enable_lazy_loading: enableLazyLoading,
    };
    api.put('/admin/settings', data).then(() => {
      toast.success('Changes saved successfully');
    }).catch((error: unknown) => {
      if (error instanceof ApiError && error.errors) {
        const mapped: Record<string, string> = {};
        for (const [key, messages] of Object.entries(error.errors)) {
          if (messages.length > 0) {
            mapped[key] = messages[0];
          }
        }
        setFieldErrors(mapped);
        toast.error('Failed to save changes');
      }
    }).finally(() => {
      activeSavesRef.current--;
      setSaving(activeSavesRef.current > 0);
    });
  }, [siteName, siteUrl, siteDescription, metaTitle, metaDescription, enableSeo, enableCaching, enableImageOptimization, enableLazyLoading]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    doSave();
  };

  const handleToggleSave = (key: string, value: boolean) => {
    doSave({ [key]: value });
  };

  const fieldErrorClass = (field: string) =>
    fieldErrors[field] ? 'border-red-500' : '';

  return (
    <div className="px-10 pt-10 pb-6">
      <div className="mb-10">
        <h1 className="text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your CMS configuration and preferences.</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="max-w-3xl space-y-6">
          <Card className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="dark:text-white">General Settings</CardTitle>
              <CardDescription className="dark:text-gray-400">Update your site's basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName" className="text-sm text-gray-700 dark:text-gray-300">Site Name</Label>
                <Input
                  id="siteName"
                  placeholder="ContentFlow CMS"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  onBlur={() => doSave({ site_name: siteName })}
                  className={`h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl ${fieldErrorClass('site_name')}`}
                />
                {fieldErrors.site_name && (
                  <p className="text-xs text-red-500">{fieldErrors.site_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteUrl" className="text-sm text-gray-700 dark:text-gray-300">Site URL</Label>
                <Input
                  id="siteUrl"
                  placeholder="https://example.com"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  onBlur={() => doSave({ site_url: siteUrl })}
                  className={`h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl ${fieldErrorClass('site_url')}`}
                />
                {fieldErrors.site_url && (
                  <p className="text-xs text-red-500">{fieldErrors.site_url}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm text-gray-700 dark:text-gray-300">Site Description</Label>
                <Input
                  id="description"
                  placeholder="A modern content management system"
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  onBlur={() => doSave({ site_description: siteDescription })}
                  className={`h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl ${fieldErrorClass('site_description')}`}
                />
                {fieldErrors.site_description && (
                  <p className="text-xs text-red-500">{fieldErrors.site_description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 dark:border dark:border-gray-800 shadow-sm dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="dark:text-white">SEO Settings</CardTitle>
              <CardDescription className="dark:text-gray-400">Configure search engine optimization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle" className="text-sm text-gray-700 dark:text-gray-300">Default Meta Title</Label>
                <Input
                  id="metaTitle"
                  placeholder="ContentFlow - Modern CMS"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  onBlur={() => doSave({ meta_title: metaTitle })}
                  className={`h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl ${fieldErrorClass('meta_title')}`}
                />
                {fieldErrors.meta_title && (
                  <p className="text-xs text-red-500">{fieldErrors.meta_title}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription" className="text-sm text-gray-700 dark:text-gray-300">Default Meta Description</Label>
                <Input
                  id="metaDescription"
                  placeholder="Build beautiful websites with our modern CMS"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  onBlur={() => doSave({ meta_description: metaDescription })}
                  className={`h-11 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl ${fieldErrorClass('meta_description')}`}
                />
                {fieldErrors.meta_description && (
                  <p className="text-xs text-red-500">{fieldErrors.meta_description}</p>
                )}
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label className="text-sm text-gray-700 dark:text-gray-300">Enable SEO Optimization</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Automatically optimize content for search engines</p>
                </div>
                <Switch
                  checked={enableSeo}
                  onCheckedChange={(checked) => {
                    setEnableSeo(checked);
                    handleToggleSave('enable_seo', checked);
                  }}
                />
              </div>
            </CardContent>
          </Card>

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
                <Switch
                  checked={enableCaching}
                  onCheckedChange={(checked) => {
                    setEnableCaching(checked);
                    handleToggleSave('enable_caching', checked);
                  }}
                />
              </div>
              <Separator className="bg-gray-100 dark:bg-gray-800" />
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label className="text-sm text-gray-700 dark:text-gray-300">Image Optimization</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Automatically compress and optimize images</p>
                </div>
                <Switch
                  checked={enableImageOptimization}
                  onCheckedChange={(checked) => {
                    setEnableImageOptimization(checked);
                    handleToggleSave('enable_image_optimization', checked);
                  }}
                />
              </div>
              <Separator className="bg-gray-100 dark:bg-gray-800" />
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label className="text-sm text-gray-700 dark:text-gray-300">Lazy Loading</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Load images only when they're visible</p>
                </div>
                <Switch
                  checked={enableLazyLoading}
                  onCheckedChange={(checked) => {
                    setEnableLazyLoading(checked);
                    handleToggleSave('enable_lazy_loading', checked);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-blue-300 shadow-md shadow-indigo-500/20"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
