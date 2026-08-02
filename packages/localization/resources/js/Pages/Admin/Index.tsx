import { useState } from 'react';
import { router } from '@inertiajs/react';
import { api } from '@adapter/api';
import { DataTable, type DataTableColumn } from '@components/DataTable';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ui/dialog';
import { DropdownMenuItem } from '@ui/dropdown-menu';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import type { Language } from '../../types';
import { LanguageFlag } from '../../components/LanguageFlag';

interface LocalizationProps {
  languages: Language[];
}

interface LanguageForm {
  name: string;
  native_name: string;
  locale: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  fallback_language_id: string;
  is_default: boolean;
}

const emptyForm: LanguageForm = {
  name: '',
  native_name: '',
  locale: '',
  flag: '',
  direction: 'ltr',
  fallback_language_id: 'none',
  is_default: false,
};

export default function LocalizationIndex({ languages }: LocalizationProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Language | null>(null);
  const [form, setForm] = useState<LanguageForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set());
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<Language | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (language: Language) => {
    setEditing(language);
    setForm({
      name: language.name,
      native_name: language.nativeName,
      locale: language.locale,
      flag: language.flag,
      direction: language.direction,
      fallback_language_id: languages.find(
        (candidate) => candidate.locale === language.fallbackLocale,
      )?.id ?? 'none',
      is_default: language.isDefault,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const save = () => {
    setSaving(true);
    setErrors({});

    const payload = {
      ...form,
      fallback_language_id: form.fallback_language_id === 'none'
        ? null
        : form.fallback_language_id,
    };
    const url = editing
      ? `/admin/localization/languages/${editing.id}`
      : '/admin/localization/languages';
    const method = editing ? api.put : api.post;

    method(url, payload, {
      inertia: true,
      preserveScroll: true,
      onSuccess: () => setDialogOpen(false),
      onError: (nextErrors) => setErrors(nextErrors),
      onFinish: () => setSaving(false),
    });
  };

  const remove = (targets: Language[]) => {
    const ids = targets.map((language) => language.id);
    setDeletingIds(new Set(ids));
    setDeleteError(null);

    const options = {
      inertia: true as const,
      preserveScroll: true,
      onSuccess: () => setSingleDeleteTarget(null),
      onError: (nextErrors: Record<string, string>) => {
        setDeleteError(Object.values(nextErrors)[0] ?? 'The languages could not be removed.');
      },
      onFinish: () => setDeletingIds(new Set()),
    };

    if (ids.length === 1) {
      api.delete(`/admin/localization/languages/${ids[0]}`, options);
      return;
    }

    router.visit('/admin/localization/languages', {
      method: 'delete',
      data: { ids },
      preserveScroll: true,
      onError: options.onError,
      onFinish: options.onFinish,
    });
  };

  const columns: DataTableColumn<Language>[] = [
    {
      key: 'language',
      header: 'Language',
      render: (language) => (
        <div className="flex items-center gap-3">
          <LanguageFlag language={language} className="text-2xl" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{language.name}</p>
            <p className="text-xs text-gray-500">{language.nativeName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'locale',
      header: 'Locale',
      render: (language) => (
        <code className="rounded-lg bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
          {language.locale}
        </code>
      ),
    },
    {
      key: 'fallback',
      header: 'Fallback',
      render: (language) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {language.fallbackLocale ?? '—'}
        </span>
      ),
    },
    {
      key: 'direction',
      header: 'Direction',
      render: (language) => (
        <span className="text-sm uppercase text-gray-600 dark:text-gray-300">
          {language.direction}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (language) => language.isDefault ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          <Star className="size-3" /> Default
        </span>
      ) : (
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Installed
        </span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        items={languages}
        itemKey={(language) => language.id}
        columns={columns}
        searchPlaceholder="Search languages or locale codes..."
        searchFilter={(language, query) => {
          const normalized = query.toLocaleLowerCase();
          return [language.name, language.nativeName, language.locale]
            .some((value) => value.toLocaleLowerCase().includes(normalized));
        }}
        title="Localization"
        description="Manage installed languages, fallbacks, flags, and text direction."
        headerAction={(
          <Button onClick={openCreate} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="size-4" />
            Install language
          </Button>
        )}
        selectable={(language) => !language.isDefault}
        onDelete={remove}
        deletingIds={deletingIds}
        isDeleting={deletingIds.size > 0}
        deleteError={deleteError}
        onClearDelete={() => setDeleteError(null)}
        deleteConfirmDescription={(targets) =>
          `This removes ${targets.length === 1 ? 'the language and its' : 'these languages and their'} stored translations. This cannot be undone.`
        }
        renderActions={(language) => (
          <>
            <DropdownMenuItem onSelect={() => openEdit(language)}>
              <Pencil className="size-4" /> Edit
            </DropdownMenuItem>
            {!language.isDefault && (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setSingleDeleteTarget(language)}
              >
                <Trash2 className="size-4" /> Remove
              </DropdownMenuItem>
            )}
          </>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => !saving && setDialogOpen(open)}>
        <DialogContent className="max-w-xl dark:border-gray-800 dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit language' : 'Install language'}</DialogTitle>
            <DialogDescription>
              Locale codes use BCP 47 format, such as en, da-DK, or ar-SA.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Language name" error={errors.name}>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Danish" />
            </FormField>
            <FormField label="Native name" error={errors.native_name}>
              <Input value={form.native_name} onChange={(event) => setForm({ ...form, native_name: event.target.value })} placeholder="Dansk" />
            </FormField>
            <FormField label="Locale code" error={errors.locale}>
              <Input value={form.locale} onChange={(event) => setForm({ ...form, locale: event.target.value })} placeholder="da-DK" />
            </FormField>
            <FormField label="Flag country code" error={errors.flag}>
              <Input value={form.flag} onChange={(event) => setForm({ ...form, flag: event.target.value })} placeholder="dk" />
            </FormField>
            <FormField label="Text direction" error={errors.direction}>
              <Select value={form.direction} onValueChange={(direction: 'ltr' | 'rtl') => setForm({ ...form, direction })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ltr">Left to right</SelectItem>
                  <SelectItem value="rtl">Right to left</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Fallback language" error={errors.fallback_language_id}>
              <Select value={form.fallback_language_id} onValueChange={(fallback_language_id) => setForm({ ...form, fallback_language_id })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No fallback</SelectItem>
                  {languages.filter((language) => language.id !== editing?.id).map((language) => (
                    <SelectItem key={language.id} value={language.id}>
                      <span className="flex items-center gap-2">
                        <LanguageFlag language={language} /> {language.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {!editing?.isDefault && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-700">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(event) => setForm({ ...form, is_default: event.target.checked })}
                className="size-4"
              />
              Make this the default language
            </label>
          )}

          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={saving} onClick={save} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Install language'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={singleDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && deletingIds.size === 0) setSingleDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {singleDeleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the language and all of its stored translations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingIds.size > 0}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingIds.size > 0}
              onClick={(event) => {
                event.preventDefault();
                if (singleDeleteTarget) {
                  remove([singleDeleteTarget]);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove language
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
