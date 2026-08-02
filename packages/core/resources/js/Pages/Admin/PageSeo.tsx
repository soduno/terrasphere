import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Circle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@adapter/api';
import { Button } from '@ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card';
import { Checkbox } from '@ui/checkbox';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select';
import { Textarea } from '@ui/textarea';
import { LanguageSelector } from '@localization/components/LanguageSelector';
import type { Language } from '@localization/types';

type RobotsChoice = 'default' | 'allow' | 'disallow';

interface SeoData {
  metaTitle: string | null;
  metaDescription: string | null;
  focusKeyphrase: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean | null;
  robotsFollow: boolean | null;
  robotsNoarchive: boolean;
  robotsNosnippet: boolean;
  robotsNoimageindex: boolean;
  socialTitle: string | null;
  socialDescription: string | null;
  socialImage: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  schemaType: string | null;
}

interface PageSeoProps {
  page: SeoData & {
    id: number;
    title: string;
  };
  languages: Language[];
  locale: string;
}

const schemaTypes = [
  { value: 'WebPage', label: 'Web page' },
  { value: 'AboutPage', label: 'About page' },
  { value: 'ContactPage', label: 'Contact page' },
  { value: 'CollectionPage', label: 'Collection page' },
  { value: 'ItemPage', label: 'Item page' },
  { value: 'FAQPage', label: 'FAQ page' },
  { value: 'ProfilePage', label: 'Profile page' },
] as const;

function toRobotsChoice(value: boolean | null): RobotsChoice {
  if (value === null) return 'default';
  return value ? 'allow' : 'disallow';
}

function fromRobotsChoice(value: RobotsChoice): boolean | null {
  if (value === 'default') return null;
  return value === 'allow';
}

export default function PageSeo({ page, languages, locale }: PageSeoProps) {
  const [metaTitle, setMetaTitle] = useState(page.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(page.metaDescription ?? '');
  const [focusKeyphrase, setFocusKeyphrase] = useState(page.focusKeyphrase ?? '');
  const [canonicalUrl, setCanonicalUrl] = useState(page.canonicalUrl ?? '');
  const [robotsIndex, setRobotsIndex] = useState<RobotsChoice>(toRobotsChoice(page.robotsIndex));
  const [robotsFollow, setRobotsFollow] = useState<RobotsChoice>(toRobotsChoice(page.robotsFollow));
  const [robotsNoarchive, setRobotsNoarchive] = useState(page.robotsNoarchive);
  const [robotsNosnippet, setRobotsNosnippet] = useState(page.robotsNosnippet);
  const [robotsNoimageindex, setRobotsNoimageindex] = useState(page.robotsNoimageindex);
  const [socialTitle, setSocialTitle] = useState(page.socialTitle ?? '');
  const [socialDescription, setSocialDescription] = useState(page.socialDescription ?? '');
  const [socialImage, setSocialImage] = useState(page.socialImage ?? '');
  const [twitterTitle, setTwitterTitle] = useState(page.twitterTitle ?? '');
  const [twitterDescription, setTwitterDescription] = useState(page.twitterDescription ?? '');
  const [schemaType, setSchemaType] = useState(page.schemaType ?? 'WebPage');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const checks = useMemo(() => {
    const keyphrase = focusKeyphrase.trim().toLocaleLowerCase();
    const title = metaTitle.trim().toLocaleLowerCase();
    const description = metaDescription.trim().toLocaleLowerCase();

    return [
      {
        label: 'Meta title is between 30 and 60 characters',
        passed: metaTitle.length >= 30 && metaTitle.length <= 60,
      },
      {
        label: 'Meta description is between 120 and 160 characters',
        passed: metaDescription.length >= 120 && metaDescription.length <= 160,
      },
      {
        label: 'A focus keyphrase has been added',
        passed: keyphrase.length > 0,
      },
      {
        label: 'Focus keyphrase appears in the meta title',
        passed: keyphrase.length > 0 && title.includes(keyphrase),
      },
      {
        label: 'Focus keyphrase appears in the meta description',
        passed: keyphrase.length > 0 && description.includes(keyphrase),
      },
      {
        label: 'A social sharing image has been added',
        passed: socialImage.trim().length > 0,
      },
    ];
  }, [focusKeyphrase, metaDescription, metaTitle, socialImage]);

  const applyResponse = (response: SeoData) => {
    setMetaTitle(response.metaTitle ?? '');
    setMetaDescription(response.metaDescription ?? '');
    setFocusKeyphrase(response.focusKeyphrase ?? '');
    setCanonicalUrl(response.canonicalUrl ?? '');
    setRobotsIndex(toRobotsChoice(response.robotsIndex));
    setRobotsFollow(toRobotsChoice(response.robotsFollow));
    setRobotsNoarchive(response.robotsNoarchive);
    setRobotsNosnippet(response.robotsNosnippet);
    setRobotsNoimageindex(response.robotsNoimageindex);
    setSocialTitle(response.socialTitle ?? '');
    setSocialDescription(response.socialDescription ?? '');
    setSocialImage(response.socialImage ?? '');
    setTwitterTitle(response.twitterTitle ?? '');
    setTwitterDescription(response.twitterDescription ?? '');
    setSchemaType(response.schemaType ?? 'WebPage');
  };

  const handleSave = async () => {
    setSaving(true);
    setFieldErrors({});

    try {
      const response = await api.patch<SeoData>(`/admin/pages/${page.id}/seo`, {
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        focus_keyphrase: focusKeyphrase.trim() || null,
        canonical_url: canonicalUrl.trim() || null,
        robots_index: fromRobotsChoice(robotsIndex),
        robots_follow: fromRobotsChoice(robotsFollow),
        robots_noarchive: robotsNoarchive,
        robots_nosnippet: robotsNosnippet,
        robots_noimageindex: robotsNoimageindex,
        social_title: socialTitle.trim() || null,
        social_description: socialDescription.trim() || null,
        social_image: socialImage.trim() || null,
        twitter_title: twitterTitle.trim() || null,
        twitter_description: twitterDescription.trim() || null,
        schema_type: schemaType,
        locale,
      });

      applyResponse(response);
      toast.success('SEO settings saved.');
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const errors: Record<string, string> = {};

        for (const [field, messages] of Object.entries(error.errors)) {
          if (messages[0]) errors[field] = messages[0];
        }

        setFieldErrors(errors);
      }

      toast.error('SEO settings could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const inputErrorClass = (field: string) => fieldErrors[field] ? 'border-red-500' : '';
  const previewTitle = metaTitle.trim() || page.title;
  const previewDescription = metaDescription.trim() || 'The global meta description will be used.';
  const previewUrl = canonicalUrl.trim() || 'https://example.com/page';

  return (
    <div className="px-10 pt-10 pb-10">
      <div className="mb-10 flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.visit('/admin/content')}
            className="mt-0.5 gap-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div>
            <h1 className="mb-2 text-gray-900 dark:text-white">SEO for {page.title}</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Optimize how this page is understood and presented by search engines and social platforms.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector
            languages={languages}
            locale={locale}
            onSelect={(language) => {
              if (language.locale !== locale) {
                router.visit(
                  `/admin/pages/${page.id}/seo?locale=${encodeURIComponent(language.locale)}`,
                );
              }
            }}
          />
          <Button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="gap-2 bg-indigo-600 shadow-md shadow-indigo-500/20 hover:bg-indigo-700"
          >
            <Save className="size-4" />
            {saving ? 'Saving...' : 'Save SEO'}
          </Button>
        </div>
      </div>

      <div className="grid max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="border-0 shadow-sm dark:border dark:border-gray-800 dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="dark:text-white">Search appearance</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Control the title and description shown in search results.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="focus-keyphrase">Focus keyphrase</Label>
                <Input
                  id="focus-keyphrase"
                  value={focusKeyphrase}
                  maxLength={255}
                  placeholder="e.g. sustainable garden design"
                  onChange={(event) => setFocusKeyphrase(event.target.value)}
                  className={`h-11 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:text-white ${inputErrorClass('focus_keyphrase')}`}
                />
                <p className="text-xs text-gray-500">Used for the content checks on this page; it is not output as a meta tag.</p>
                {fieldErrors.focus_keyphrase && <p className="text-xs text-red-500">{fieldErrors.focus_keyphrase}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="meta-title">Meta title</Label>
                  <span className={`text-xs ${metaTitle.length > 60 ? 'text-amber-600' : 'text-gray-500'}`}>{metaTitle.length}/60 recommended</span>
                </div>
                <Input
                  id="meta-title"
                  value={metaTitle}
                  maxLength={255}
                  placeholder="Use global meta title"
                  onChange={(event) => setMetaTitle(event.target.value)}
                  className={`h-11 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:text-white ${inputErrorClass('meta_title')}`}
                />
                {fieldErrors.meta_title && <p className="text-xs text-red-500">{fieldErrors.meta_title}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="meta-description">Meta description</Label>
                  <span className={`text-xs ${metaDescription.length > 160 ? 'text-amber-600' : 'text-gray-500'}`}>{metaDescription.length}/160 recommended</span>
                </div>
                <Textarea
                  id="meta-description"
                  value={metaDescription}
                  maxLength={1000}
                  rows={5}
                  placeholder="Use global meta description"
                  onChange={(event) => setMetaDescription(event.target.value)}
                  className={`resize-none rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:text-white ${inputErrorClass('meta_description')}`}
                />
                {fieldErrors.meta_description && <p className="text-xs text-red-500">{fieldErrors.meta_description}</p>}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-950">
                <p className="mb-1 truncate text-sm text-emerald-700 dark:text-emerald-400">{previewUrl}</p>
                <p className="mb-1 truncate text-xl text-blue-700 dark:text-blue-400">{previewTitle}</p>
                <p className="line-clamp-2 text-sm leading-6 text-gray-600 dark:text-gray-400">{previewDescription}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm dark:border dark:border-gray-800 dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="dark:text-white">Social appearance</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Customize Open Graph and Twitter content used when this page is shared.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="social-title">Open Graph title</Label>
                <Input
                  id="social-title"
                  value={socialTitle}
                  maxLength={255}
                  placeholder="Falls back to the meta title"
                  onChange={(event) => setSocialTitle(event.target.value)}
                  className={`h-11 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:text-white ${inputErrorClass('social_title')}`}
                />
                {fieldErrors.social_title && <p className="text-xs text-red-500">{fieldErrors.social_title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="social-description">Open Graph description</Label>
                <Textarea
                  id="social-description"
                  value={socialDescription}
                  maxLength={1000}
                  rows={4}
                  placeholder="Falls back to the meta description"
                  onChange={(event) => setSocialDescription(event.target.value)}
                  className={`resize-none rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:text-white ${inputErrorClass('social_description')}`}
                />
                {fieldErrors.social_description && <p className="text-xs text-red-500">{fieldErrors.social_description}</p>}
              </div>
              <div className="border-t border-gray-100 pt-6 dark:border-gray-800">
                <p className="mb-4 text-sm font-medium text-gray-900 dark:text-white">Twitter overrides</p>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="twitter-title">Twitter title</Label>
                    <Input
                      id="twitter-title"
                      value={twitterTitle}
                      maxLength={255}
                      placeholder="Falls back to the Open Graph title"
                      onChange={(event) => setTwitterTitle(event.target.value)}
                      className={`h-11 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:text-white ${inputErrorClass('twitter_title')}`}
                    />
                    {fieldErrors.twitter_title && <p className="text-xs text-red-500">{fieldErrors.twitter_title}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter-description">Twitter description</Label>
                    <Textarea
                      id="twitter-description"
                      value={twitterDescription}
                      maxLength={1000}
                      rows={4}
                      placeholder="Falls back to the Open Graph description"
                      onChange={(event) => setTwitterDescription(event.target.value)}
                      className={`resize-none rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:text-white ${inputErrorClass('twitter_description')}`}
                    />
                    {fieldErrors.twitter_description && <p className="text-xs text-red-500">{fieldErrors.twitter_description}</p>}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="social-image">Social image URL</Label>
                <Input
                  id="social-image"
                  type="url"
                  value={socialImage}
                  maxLength={2048}
                  placeholder="https://example.com/share-image.jpg"
                  onChange={(event) => setSocialImage(event.target.value)}
                  className={`h-11 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:text-white ${inputErrorClass('social_image')}`}
                />
                <p className="text-xs text-gray-500">A 1200 × 630 px image generally works well across social platforms.</p>
                {fieldErrors.social_image && <p className="text-xs text-red-500">{fieldErrors.social_image}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm dark:border dark:border-gray-800 dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="dark:text-white">Advanced</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Control canonicalization, crawling and structured data for this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="canonical-url">Canonical URL</Label>
                <Input
                  id="canonical-url"
                  type="url"
                  value={canonicalUrl}
                  maxLength={2048}
                  placeholder="Automatically use this page's URL"
                  onChange={(event) => setCanonicalUrl(event.target.value)}
                  className={`h-11 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:text-white ${inputErrorClass('canonical_url')}`}
                />
                <p className="text-xs text-gray-500">Only override this when another URL is the preferred version of equivalent content.</p>
                {fieldErrors.canonical_url && <p className="text-xs text-red-500">{fieldErrors.canonical_url}</p>}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Search indexing</Label>
                  <Select value={robotsIndex} onValueChange={(value) => setRobotsIndex(value as RobotsChoice)}>
                    <SelectTrigger className="h-11 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use site default</SelectItem>
                      <SelectItem value="allow">Index this page</SelectItem>
                      <SelectItem value="disallow">Do not index this page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Link following</Label>
                  <Select value={robotsFollow} onValueChange={(value) => setRobotsFollow(value as RobotsChoice)}>
                    <SelectTrigger className="h-11 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use site default</SelectItem>
                      <SelectItem value="allow">Follow links</SelectItem>
                      <SelectItem value="disallow">Do not follow links</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <RobotsCheckbox checked={robotsNoarchive} onChange={setRobotsNoarchive} label="No archive" description="Prevent search engines from showing a cached copy." />
                <RobotsCheckbox checked={robotsNosnippet} onChange={setRobotsNosnippet} label="No snippet" description="Prevent text and video previews in search results." />
                <RobotsCheckbox checked={robotsNoimageindex} onChange={setRobotsNoimageindex} label="No image index" description="Prevent images on this page from being indexed." />
              </div>

              <div className="space-y-2">
                <Label>Schema page type</Label>
                <Select value={schemaType} onValueChange={setSchemaType}>
                  <SelectTrigger className="h-11 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {schemaTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Describes the purpose of the page to search engines.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="border-0 shadow-sm dark:border dark:border-gray-800 dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="dark:text-white">SEO checks</CardTitle>
              <CardDescription className="dark:text-gray-400">
                {checks.filter((check) => check.passed).length} of {checks.length} recommendations passed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {checks.map((check) => (
                <div key={check.label} className="flex items-start gap-3 text-sm">
                  {check.passed
                    ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    : <Circle className="mt-0.5 size-4 shrink-0 text-gray-300 dark:text-gray-600" />}
                  <span className={check.passed ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}>{check.label}</span>
                </div>
              ))}
              <p className="pt-2 text-xs leading-5 text-gray-500">These checks are editorial guidance, not a guarantee of search ranking.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

interface RobotsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
}

function RobotsCheckbox({ checked, onChange, label, description }: RobotsCheckboxProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        checked={checked}
        onCheckedChange={(nextChecked) => onChange(nextChecked === true)}
        aria-label={label}
        className="mt-0.5"
      />
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}
