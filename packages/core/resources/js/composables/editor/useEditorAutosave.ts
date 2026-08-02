import { useEffect, useRef, useState } from 'react';
import { api } from '@adapter/api';
import type {
  EditorSaveResponse,
  EditorSaveStatus,
  UseEditorAutosaveOptions,
} from '../../types/editor';

export type { EditorSaveStatus } from '../../types/editor';

export function useEditorAutosave({
  pageId,
  elements,
  initialElements,
  initialLockVersion,
  locale,
  delay = 800,
}: UseEditorAutosaveOptions): EditorSaveStatus {
  const [status, setStatus] = useState<EditorSaveStatus>('saved');
  const lockVersionRef = useRef(initialLockVersion);
  const lastSavedElementsRef = useRef(JSON.stringify(initialElements));

  useEffect(() => {
    const serializedElements = JSON.stringify(elements);
    if (serializedElements === lastSavedElementsRef.current) return;

    const timeout = window.setTimeout(async () => {
      setStatus('saving');

      try {
        const result = await api.put<EditorSaveResponse>(
          `/admin/pages/${pageId}/wysiwyg`,
          {
            elements,
            lock_version: lockVersionRef.current,
            locale,
          },
        );
        lockVersionRef.current = result.lockVersion;
        lastSavedElementsRef.current = serializedElements;
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [delay, elements, locale, pageId]);

  return status;
}
