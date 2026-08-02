import { useState } from 'react';
import { api } from '@adapter/api';
import type { UseEditablePageTitleOptions } from '../../types/editor';

export function useEditablePageTitle({
  pageId,
  initialTitle,
  locale,
}: UseEditablePageTitleOptions) {
  const [title, setTitleState] = useState(initialTitle);
  const [savedTitle, setSavedTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setTitle = (value: string) => {
    setTitleState(value);
    setError(null);
  };

  const startEditing = () => {
    if (isSaving || pageId === undefined) return;

    setError(null);
    setIsEditing(true);
  };

  const cancel = () => {
    setTitleState(savedTitle);
    setError(null);
    setIsEditing(false);
  };

  const save = () => {
    if (isSaving || pageId === undefined) return;

    const nextTitle = title.trim();

    if (!nextTitle) {
      setError('The page name cannot be empty.');
      return;
    }

    setIsEditing(false);
    setError(null);

    if (nextTitle === savedTitle) {
      setTitleState(nextTitle);
      return;
    }

    setIsSaving(true);
    api.patch(
      `/admin/pages/${pageId}/title`,
      { title: nextTitle, locale },
      {
        inertia: true,
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setTitleState(nextTitle);
          setSavedTitle(nextTitle);
        },
        onError: (errors) => {
          const message = Object.values(errors)[0];

          setError(
            typeof message === 'string'
              ? message
              : 'The page name could not be saved.',
          );
          setIsEditing(true);
        },
        onFinish: () => setIsSaving(false),
      },
    );
  };

  return {
    title,
    savedTitle,
    isEditing,
    isSaving,
    error,
    setTitle,
    startEditing,
    cancel,
    save,
  };
}
