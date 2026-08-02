import { useState } from 'react';
import { CopyPlus, LoaderCircle } from 'lucide-react';
import { api, ApiError } from '@adapter/api';
import { Button } from '@ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select';
import type { Language } from '../types';
import { LanguageFlag } from './LanguageFlag';

interface DuplicateWysiwygDialogProps {
  pageId: number;
  targetLanguage: Language;
  sources: Language[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDuplicated: () => void;
}

export function DuplicateWysiwygDialog({
  pageId,
  targetLanguage,
  sources,
  open,
  onOpenChange,
  onDuplicated,
}: DuplicateWysiwygDialogProps) {
  const [sourceLocale, setSourceLocale] = useState(
    sources.find((language) => language.isDefault)?.locale
      ?? sources[0]?.locale
      ?? '',
  );
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicate = async () => {
    if (!sourceLocale || duplicating) return;

    setDuplicating(true);
    setError(null);

    try {
      await api.post(
        `/admin/pages/${pageId}/wysiwyg/${encodeURIComponent(targetLanguage.locale)}/duplicate`,
        { source_locale: sourceLocale },
      );
      onDuplicated();
    } catch (reason) {
      const validationError = reason instanceof ApiError
        ? Object.values(reason.errors).flat()[0]
        : undefined;
      setError(validationError
        ?? (reason instanceof Error ? reason.message : 'The content could not be duplicated.'));
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !duplicating && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-lg dark:border-gray-800 dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <LanguageFlag language={targetLanguage} className="text-xl" />
            Start the {targetLanguage.name} translation
          </DialogTitle>
          <DialogDescription>
            Duplicate an existing language as a starting point, including the page title and complete visual-editor canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Copy content from
          </label>
          <Select value={sourceLocale} onValueChange={setSourceLocale} disabled={duplicating}>
            <SelectTrigger className="h-11 rounded-xl dark:border-gray-700 dark:bg-gray-800">
              <SelectValue placeholder="Choose a language" />
            </SelectTrigger>
            <SelectContent>
              {sources.map((language) => (
                <SelectItem key={language.id} value={language.locale}>
                  <span className="flex items-center gap-2">
                    <LanguageFlag language={language} />
                    {language.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={duplicating}
            onClick={() => onOpenChange(false)}
          >
            Start blank
          </Button>
          <Button
            type="button"
            disabled={!sourceLocale || duplicating}
            onClick={() => void duplicate()}
            className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700 dark:text-white"
          >
            {duplicating
              ? <LoaderCircle className="size-4 animate-spin" />
              : <CopyPlus className="size-4" />}
            {duplicating ? 'Duplicating…' : 'Duplicate content'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
