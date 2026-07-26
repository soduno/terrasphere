import {
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
  type MouseEvent,
} from 'react';
import type {
  EditorElement,
  UseInlineElementEditingOptions,
} from '../../types/editor';

function defaultElementContent(element: EditorElement): string {
  if (element.type === 'heading') return 'Heading Text';
  if (element.type === 'wysiwyg') return '<p>Start writing...</p>';
  return 'Click to edit...';
}

export function useInlineElementEditing({
  element,
  onUpdate,
  onContentRendered,
}: UseInlineElementEditingOptions) {
  const editableRef = useRef<HTMLDivElement>(null);
  const draftContentRef = useRef<string | null>(null);
  const contentRenderedCallbackRef = useRef(onContentRendered);
  const [isEditing, setIsEditing] = useState(false);

  contentRenderedCallbackRef.current = onContentRendered;

  const setDraftContent = (content: string) => {
    draftContentRef.current = content;
  };

  const saveCurrentContent = () => {
    if (!editableRef.current) return;

    const content = editableRef.current.innerHTML;
    setDraftContent(content);
    onUpdate(element.id, { content });
  };

  const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (
      element.type !== 'text'
      && element.type !== 'heading'
      && element.type !== 'wysiwyg'
    ) return;

    event.stopPropagation();
    setDraftContent(event.currentTarget.innerHTML);
    setIsEditing(true);
  };

  const handleInput = (event: FormEvent<HTMLDivElement>) => {
    setDraftContent(event.currentTarget.innerHTML);
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const content = draftContentRef.current ?? event.currentTarget.innerHTML;
    draftContentRef.current = null;
    onUpdate(element.id, { content });
    setIsEditing(false);
  };

  useLayoutEffect(() => {
    if (isEditing || !editableRef.current) return;

    const content = element.content || defaultElementContent(element);

    if (editableRef.current.innerHTML !== content) {
      editableRef.current.innerHTML = content;
    }

    contentRenderedCallbackRef.current?.(editableRef.current);
  }, [element.content, element.type, isEditing]);

  return {
    editableRef,
    isEditing,
    setDraftContent,
    saveCurrentContent,
    handleDoubleClick,
    handleInput,
    handleBlur,
  };
}
