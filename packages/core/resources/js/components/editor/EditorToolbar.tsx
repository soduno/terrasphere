import { ArrowLeft, Eye, Globe, LoaderCircle, Monitor, Pencil, Save, Smartphone } from 'lucide-react';
import { router } from '@inertiajs/react';
import { api } from '@adapter/api';
import { useEditablePageTitle } from '../../composables/editor/useEditablePageTitle';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import type { EditorToolbarProps } from '../../types/editor';
import { LanguageSelector } from '@localization/components/LanguageSelector';

export function EditorToolbar({
  pageId,
  title,
  status,
  saveStatus,
  languages = [],
  locale = 'en',
}: EditorToolbarProps) {
  const pageTitle = useEditablePageTitle({
    pageId,
    initialTitle: title,
    locale,
  });

  const isPublished = status === 'published';

  const handlePublish = () => {
    if (pageId) {
      api.patch(`/admin/pages/${pageId}/publish`, {}, { inertia: true });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.visit('/admin/content')}
          className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Separator orientation="vertical" className="h-6 bg-gray-200 dark:bg-gray-700" />
        <div className="min-w-0">
          {pageTitle.isEditing ? (
            <Input
              value={pageTitle.title}
              onChange={(event) => {
                pageTitle.setTitle(event.target.value);
              }}
              onBlur={pageTitle.save}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  event.currentTarget.blur();
                }

                if (event.key === 'Escape') {
                  event.preventDefault();
                  pageTitle.cancel();
                }
              }}
              onFocus={(event) => event.currentTarget.select()}
              autoFocus
              maxLength={255}
              aria-label="Page name"
              className="h-8 w-64 rounded-lg border-indigo-400 px-2 text-sm font-medium ring-2 ring-indigo-500/15 dark:bg-gray-800 dark:text-white"
            />
          ) : (
            <button
              type="button"
              onDoubleClick={pageTitle.startEditing}
              disabled={pageTitle.isSaving || pageId === undefined}
              title="Double-click to rename"
              className="group -ml-2 flex max-w-72 items-center gap-2 rounded-md px-2 py-0.5 text-left text-sm text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-wait dark:text-white dark:hover:bg-gray-800"
            >
              <span className="truncate">{pageTitle.title}</span>
              {pageTitle.isSaving
                ? <LoaderCircle className="size-3.5 shrink-0 animate-spin text-gray-400" />
                : <Pencil className="size-3 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />}
            </button>
          )}
          {pageTitle.error && <p className="text-xs text-red-500">{pageTitle.error}</p>}
          <p className={`text-xs ${
            saveStatus === 'error'
              ? 'text-red-500'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {saveStatus === 'saving'
              ? 'Saving…'
              : saveStatus === 'error'
                ? 'Unable to save'
                : 'All changes saved'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSelector
          languages={languages}
          locale={locale}
          onSelect={(language) => {
            if (pageId !== undefined && language.locale !== locale) {
              router.visit(`/admin/editor/${pageId}?locale=${encodeURIComponent(language.locale)}`);
            }
          }}
        />
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm">
            <Monitor className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-lg hover:bg-white dark:hover:bg-gray-900">
            <Smartphone className="w-4 h-4" />
          </Button>
        </div>
        <Separator orientation="vertical" className="h-6 bg-gray-200 dark:bg-gray-700" />
        <Button variant="outline" size="sm" className="gap-2 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
          <Eye className="w-4 h-4" />
          Preview
        </Button>
        <Button size="sm" onClick={handlePublish} className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-blue-300 shadow-md shadow-indigo-500/20">
          {isPublished ? <><Save className="w-4 h-4" />Unpublish</> : <><Globe className="w-4 h-4" />Publish</>}
        </Button>
      </div>
    </div>
  );
}
