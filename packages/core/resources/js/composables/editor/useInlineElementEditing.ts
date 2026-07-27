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
  const pendingCaretPointRef = useRef<{ x: number; y: number } | null>(null);
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

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (
      element.type !== 'text'
      && element.type !== 'heading'
      && element.type !== 'wysiwyg'
    ) return;

    if (isEditing) return;

    pendingCaretPointRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
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
    const editable = editableRef.current;
    if (!editable) return;

    if (isEditing) {
      editable.focus({ preventScroll: true });

      const point = pendingCaretPointRef.current;
      const selection = window.getSelection();
      const documentWithCaret = document as Document & {
        caretPositionFromPoint?: (
          x: number,
          y: number,
        ) => { offsetNode: Node; offset: number } | null;
        caretRangeFromPoint?: (x: number, y: number) => Range | null;
      };
      let range = point
        ? documentWithCaret.caretRangeFromPoint?.(point.x, point.y) ?? null
        : null;

      if (!range && point) {
        const caret = documentWithCaret.caretPositionFromPoint?.(
          point.x,
          point.y,
        );
        if (caret) {
          range = document.createRange();
          range.setStart(caret.offsetNode, caret.offset);
          range.collapse(true);
        }
      }

      if (!range || !editable.contains(range.startContainer)) {
        range = document.createRange();
        range.selectNodeContents(editable);
        range.collapse(false);
      }

      selection?.removeAllRanges();
      selection?.addRange(range);
      pendingCaretPointRef.current = null;
      return;
    }

    const content = element.content || defaultElementContent(element);

    if (editable.innerHTML !== content) {
      editable.innerHTML = content;
    }

    contentRenderedCallbackRef.current?.(editable);
  }, [element.content, element.type, isEditing]);

  return {
    editableRef,
    isEditing,
    setDraftContent,
    saveCurrentContent,
    handleClick,
    handleInput,
    handleBlur,
  };
}
