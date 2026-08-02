import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import type { EditorElement } from './ElementTypes';

const MAX_HISTORY_LENGTH = 100;

export function useEditorHistory(initialElements: EditorElement[]) {
  const [elements, setElementsState] = useState(initialElements);
  const elementsRef = useRef(initialElements);
  const undoHistoryRef = useRef<EditorElement[][]>([]);

  const setElements = useCallback((update: SetStateAction<EditorElement[]>) => {
    const currentElements = elementsRef.current;
    const nextElements =
      typeof update === 'function' ? update(currentElements) : update;

    if (nextElements === currentElements) return;

    undoHistoryRef.current = [
      ...undoHistoryRef.current.slice(-(MAX_HISTORY_LENGTH - 1)),
      structuredClone(currentElements),
    ];
    elementsRef.current = nextElements;
    setElementsState(nextElements);
  }, []);

  const undo = useCallback(() => {
    const previousElements = undoHistoryRef.current.pop();
    if (!previousElements) return;

    elementsRef.current = previousElements;
    setElementsState(previousElements);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 'z'
        || (!event.ctrlKey && !event.metaKey)
        || event.shiftKey
      ) {
        return;
      }

      const target = event.target;
      const isEditingContent =
        target instanceof Element
        && !!target.closest('[contenteditable="true"]');

      if (isEditingContent || undoHistoryRef.current.length === 0) return;

      event.preventDefault();
      undo();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return [elements, setElements] as const;
}
