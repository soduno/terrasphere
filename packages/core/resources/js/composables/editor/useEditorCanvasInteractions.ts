import { useState, type DragEvent, type MouseEvent } from 'react';
import { useDrop } from 'react-dnd';
import { useTransientFlag } from '../useTransientFlag';
import type {
  NewEditorElementDragItem,
  UseEditorCanvasInteractionsOptions,
} from '../../types/editor';

function containsFiles(types: readonly string[]) {
  return types.some((type) => type.toLowerCase() === 'files');
}

function findEditorElement(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest<HTMLElement>('[data-editor-element-id]')
    : null;
}

export function useEditorCanvasInteractions({
  addElement,
  onDropImageFiles,
}: UseEditorCanvasInteractionsOptions) {
  const droppedFeedback = useTransientFlag();
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [{ isOver, canDrop }, drop] = useDrop<
    NewEditorElementDragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: 'new-element',
    canDrop: (item) => !!item.isLayout,
    drop: (item, monitor) => {
      if (monitor.didDrop() || !item.isLayout) return;

      addElement(item.createElement());
      droppedFeedback.trigger();
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleMouseOver = (event: MouseEvent<HTMLDivElement>) => {
    setHoveredElement(
      findEditorElement(event.target)?.dataset.editorElementId ?? null,
    );
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!containsFiles(Array.from(event.dataTransfer.types))) return;
    event.preventDefault();
    event.stopPropagation();
    setIsFileDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!containsFiles(Array.from(event.dataTransfer.types))) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (
      event.relatedTarget instanceof Node
      && event.currentTarget.contains(event.relatedTarget)
    ) return;

    setIsFileDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!containsFiles(Array.from(event.dataTransfer.types))) return;

    event.preventDefault();
    event.stopPropagation();
    setIsFileDragging(false);

    const imageFiles = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );
    if (imageFiles.length === 0) return;

    const targetId =
      findEditorElement(event.target)?.dataset.editorElementId ?? null;
    void onDropImageFiles(imageFiles, targetId);
  };

  return {
    canDrop,
    drop,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleMouseOver,
    hoveredElement,
    isFileDragging,
    isOver,
    justDropped: droppedFeedback.isActive,
    setHoveredElement,
    showError: isOver && !canDrop,
  };
}
