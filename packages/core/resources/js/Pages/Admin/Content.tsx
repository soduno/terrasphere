import { useState } from 'react';
import { router } from '@inertiajs/react';
import { api } from '@adapter/api';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Settings2,
  LoaderCircle,
  Globe,
  FileText,
  Search,
} from 'lucide-react';
import { Button } from '@ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu';
import { DataTable, type DataTableColumn } from '@components/DataTable';
import { Tabs, TabsList, TabsTrigger } from '@ui/tabs';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@ui/hover-card';
import { NewPageModal } from './NewPageModal';
import type { Language } from '@localization/types';
import { LanguageFlag } from '@localization/components/LanguageFlag';

interface PageSummary {
  id: number;
  title: string;
  status: 'draft' | 'published' | 'archived';
  type: 'wysiwyg' | 'custom_fields';
  updatedAt: string | null;
  translatedLocales: string[];
}

interface FieldSetSummary {
  id: number;
  name: string;
  fieldCount: number;
}

interface ContentProps {
  pages: PageSummary[];
  fieldSets: FieldSetSummary[];
  filter: string;
  languages: Language[];
  defaultLocale: string;
}

export default function Content({ pages, fieldSets, filter, languages, defaultLocale }: ContentProps) {
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(() => new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<PageSummary | null>(null);
  const [translationDeleteTarget, setTranslationDeleteTarget] = useState<{
    page: PageSummary;
    language: Language;
  } | null>(null);
  const [isDeletingTranslation, setIsDeletingTranslation] = useState(false);
  const [translationDeleteError, setTranslationDeleteError] = useState<string | null>(null);

  const handleEdit = (page: PageSummary, locale = defaultLocale) => {
    const query = `?locale=${encodeURIComponent(locale)}`;
    if (page.type === 'wysiwyg') {
      router.visit(`/admin/editor/${page.id}${query}`);
    } else {
      router.visit(`/admin/fields-editor/${page.id}${query}`);
    }
  };

  const handleEditFields = (page: PageSummary) => {
    router.visit(`/admin/fields-builder/${page.id}`);
  };

  const handleEditSeo = (page: PageSummary) => {
    router.visit(`/admin/pages/${page.id}/seo`);
  };

  const handlePublish = (page: PageSummary) => {
    api.patch(`/admin/pages/${page.id}/publish`, {}, { inertia: true });
  };

  const handleDelete = (targets: PageSummary[]) => {
    const targetIds = targets.map((p) => p.id);

    setDeleteError(null);
    setDeletingIds(new Set(targetIds));
    setIsDeleting(true);

    window.setTimeout(() => {
      const options = {
        preserveScroll: true,
        onError: (errors: Record<string, string>) => {
          const message = Object.values(errors)[0];
          setDeleteError(typeof message === 'string' ? message : 'The pages could not be deleted.');
        },
        onFinish: () => {
          setDeletingIds(new Set());
          setIsDeleting(false);
        },
      };

      if (targetIds.length === 1) {
        api.delete(`/admin/pages/${targetIds[0]}`, {
          inertia: true,
          ...options,
        });
        return;
      }

      router.visit('/admin/pages', {
        method: 'delete',
        data: { ids: targetIds },
        ...options,
      });
    }, 450);
  };

  const confirmSingleDelete = () => {
    if (!singleDeleteTarget) return;
    handleDelete([singleDeleteTarget]);
    setSingleDeleteTarget(null);
  };

  const confirmTranslationDelete = () => {
    if (!translationDeleteTarget || isDeletingTranslation) return;

    const { page, language } = translationDeleteTarget;
    setIsDeletingTranslation(true);
    setTranslationDeleteError(null);

    api.delete(
      `/admin/pages/${page.id}/translations/${encodeURIComponent(language.locale)}`,
      {
        inertia: true,
        preserveScroll: true,
        onSuccess: () => setTranslationDeleteTarget(null),
        onError: (errors) => {
          setTranslationDeleteError(
            Object.values(errors)[0] ?? 'The translation could not be deleted.',
          );
        },
        onFinish: () => setIsDeletingTranslation(false),
      },
    );
  };

  const columns: DataTableColumn<PageSummary>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (page) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleEdit(page, defaultLocale);
          }}
          className="text-left text-sm font-medium text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
        >
          {page.title}
        </button>
      ),
    },
    {
      key: 'language',
      header: 'Language',
      render: (page) => (
        <div className="group/languages flex min-w-28 items-center gap-1.5">
          {languages
            .filter((language) => page.translatedLocales.includes(language.locale))
            .map((language) => (
              <HoverCard key={language.id} openDelay={180} closeDelay={120}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEdit(page, language.locale);
                    }}
                    className="rounded-md p-1 text-lg transition hover:bg-gray-100 hover:ring-1 hover:ring-indigo-200 dark:hover:bg-gray-800 dark:hover:ring-indigo-800"
                    title={`Edit ${page.title} in ${language.name}`}
                    aria-label={`Edit ${page.title} in ${language.name}`}
                  >
                    <LanguageFlag language={language} className="text-lg" />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent
                  align="start"
                  className="w-52 rounded-xl p-2"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center gap-2 px-2 py-2">
                    <LanguageFlag language={language} className="text-lg" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{language.name}</p>
                      <p className="text-xs text-gray-500">Translation available</p>
                    </div>
                  </div>
                  <div className="mt-1 grid gap-1 border-t border-gray-100 pt-1 dark:border-gray-800">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(page, language.locale)}
                      className="justify-start gap-2"
                    >
                      <Edit className="size-4" /> Edit translation
                    </Button>
                    {!language.isDefault && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTranslationDeleteError(null);
                          setTranslationDeleteTarget({ page, language });
                        }}
                        className="justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="size-4" /> Delete translation
                      </Button>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(event) => event.stopPropagation()}
                className="flex size-7 items-center justify-center rounded-md text-gray-400 opacity-40 transition hover:bg-indigo-50 hover:text-indigo-600 focus:opacity-100 sm:opacity-0 sm:group-hover/languages:opacity-100 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"
                title="Add or edit a translation"
                aria-label={`Add or edit a translation for ${page.title}`}
              >
                <Plus className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-56 rounded-xl">
              {languages.map((language) => {
                const translated = page.translatedLocales.includes(language.locale);

                return (
                  <DropdownMenuItem
                    key={language.id}
                    onSelect={() => handleEdit(page, language.locale)}
                    className="flex items-center gap-3"
                  >
                    <LanguageFlag language={language} className="text-lg" />
                    <span className="flex-1">
                      <span className="block">{language.name}</span>
                      <span className="block text-xs text-gray-500">
                        {translated ? 'Translation available' : 'Create translation'}
                      </span>
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (page) => (
        <span
          className={`px-3 py-1.5 text-xs rounded-full ${
            page.type === 'wysiwyg'
              ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400'
              : 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400'
          }`}
        >
          {page.type === 'wysiwyg' ? 'WYSIWYG' : 'Custom Fields'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (page) => (
        <span
          className={`px-3 py-1.5 text-xs rounded-full ${
            page.status === 'published'
              ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (page) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : '\u2014'}
        </span>
      ),
    },
  ];

  const tabs = [
    { key: 'all', label: 'All Pages' },
    { key: 'wysiwyg', label: 'Visual Editor' },
    { key: 'custom_fields', label: 'Custom Fields' },
  ] as const;

  return (
    <>
      <DataTable
        items={pages}
        itemKey={(page) => page.id}
        columns={columns}
        searchPlaceholder="Search pages..."
        searchFilter={(page, query) =>
          page.title.toLowerCase().includes(query.toLowerCase())
        }
        title="Content"
        description="Manage all your pages and content."
        headerAction={
          <Button
            onClick={() => setShowNewPageModal(true)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-blue-300 shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            New Page
          </Button>
        }
        onRowClick={handleEdit}
        onDelete={handleDelete}
        deletingIds={deletingIds}
        isDeleting={isDeleting}
        deleteError={deleteError}
        onClearDelete={() => setDeleteError(null)}
        deleteConfirmTitle={(targets) =>
          targets.length === 1
            ? `Delete "\u201c${targets[0]?.title}\u201d"?`
            : `Delete ${targets.length} pages?`
        }
        deleteConfirmDescription={(targets) =>
          targets.length === 1
            ? 'This permanently deletes the page and its content.'
            : 'This permanently deletes the selected pages and all of their content.'
        }
        renderActions={(page) => (
          <>
            <DropdownMenuItem onClick={() => handleEdit(page)} className="dark:hover:bg-gray-700">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {page.type === 'custom_fields' && (
              <DropdownMenuItem onClick={() => handleEditFields(page)} className="dark:hover:bg-gray-700">
                <Settings2 className="w-4 h-4 mr-2" />
                Edit Fields
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleEditSeo(page)} className="dark:hover:bg-gray-700">
              <Search className="w-4 h-4 mr-2" />
              SEO
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePublish(page)} className="dark:hover:bg-gray-700">
              {page.status === 'published'
                ? <><FileText className="w-4 h-4 mr-2" />Unpublish</>
                : <><Globe className="w-4 h-4 mr-2" />Publish</>}
            </DropdownMenuItem>
            <DropdownMenuItem className="dark:hover:bg-gray-700">
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                setDeleteError(null);
                setSingleDeleteTarget(page);
              }}
              className="dark:hover:bg-red-950/50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      >
        <Tabs value={filter} onValueChange={(value) => router.visit(`/admin/content?filter=${value}`, { preserveState: true, preserveScroll: true })} className="mb-6">
          <TabsList className="w-full max-w-md bg-gray-100 dark:bg-gray-800">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="flex-1">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </DataTable>

      <AlertDialog
        open={singleDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setSingleDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{singleDeleteTarget?.title}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the page and its content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmSingleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Delete page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={translationDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingTranslation) setTranslationDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete the {translationDeleteTarget?.language.name} translation?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the translated page title, content fields, visual-editor content,
              and SEO values for &ldquo;{translationDeleteTarget?.page.title}&rdquo;. The default
              language is not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {translationDeleteError && (
            <p className="text-sm text-destructive">{translationDeleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTranslation}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmTranslationDelete();
              }}
              disabled={isDeletingTranslation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingTranslation && <LoaderCircle className="mr-2 size-4 animate-spin" />}
              Delete translation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NewPageModal open={showNewPageModal} onClose={() => setShowNewPageModal(false)} fieldSets={fieldSets} />
    </>
  );
}
