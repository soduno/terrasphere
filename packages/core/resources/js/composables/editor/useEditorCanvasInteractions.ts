import { useState, type DragEvent, type MouseEvent } from 'react';
import { useGravityTarget } from '../../components/editor/terra-gravity/TerraGravity';
import { useTransientFlag } from '../useTransientFlag';
import type {
  DropPosition,
  EditorDragPayload,
  UseEditorCanvasInteractionsOptions,
} from '../../types/editor';

type FileDropIndicator = {
  targetElementId: string | null;
  position: DropPosition;
  left: number;
  top: number;
  width: number;
  height: number;
  replaceImage: boolean;
};

type SidebarElementPayload = Extract<
  EditorDragPayload,
  { kind: 'sidebar-element' }
>;

function containsFiles(types: readonly string[]) {
  return types.some((type) => type.toLowerCase() === 'files');
}

function isTerraGravityDrag() {
  return document.documentElement.dataset.terraGravityDragging === 'true';
}

function findEditorElement(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest<HTMLElement>('[data-editor-element-id]')
    : null;
}

function nearestEditorElement(
  canvas: HTMLDivElement,
  clientX: number,
  clientY: number,
) {
  const directTarget = document
    .elementFromPoint(clientX, clientY)
    ?.closest<HTMLElement>('[data-editor-element-id]');
  if (directTarget && canvas.contains(directTarget)) return directTarget;

  const candidates = Array.from(
    canvas.querySelectorAll<HTMLElement>('[data-editor-element-id]'),
  );

  return candidates.reduce<HTMLElement | null>((nearest, candidate) => {
    if (!nearest) return candidate;

    const candidateRect = candidate.getBoundingClientRect();
    const nearestRect = nearest.getBoundingClientRect();
    const distanceTo = (rect: DOMRect) => {
      const vertical = clientY < rect.top
        ? rect.top - clientY
        : clientY > rect.bottom
          ? clientY - rect.bottom
          : 0;
      const horizontal = clientX < rect.left
        ? rect.left - clientX
        : clientX > rect.right
          ? clientX - rect.right
          : 0;

      return vertical + horizontal * 0.25;
    };

    return distanceTo(candidateRect) < distanceTo(nearestRect)
      ? candidate
      : nearest;
  }, null);
}

export function useEditorCanvasInteractions({
  addElement,
  onDropImageFiles,
}: UseEditorCanvasInteractionsOptions) {
  const droppedFeedback = useTransientFlag();
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [fileDropIndicator, setFileDropIndicator] =
    useState<FileDropIndicator | null>(null);
  const layoutDropTarget = useGravityTarget<SidebarElementPayload>({
    accepts: (payload): payload is SidebarElementPayload =>
      payload.kind === 'sidebar-element' && payload.isLayout,
    onDrop: ({ payload }) => {
      addElement(payload.createElement());
      droppedFeedback.trigger();
    },
  });

  const handleMouseOver = (event: MouseEvent<HTMLDivElement>) => {
    setHoveredElement(
      findEditorElement(event.target)?.dataset.editorElementId ?? null,
    );
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (isTerraGravityDrag()) return;
    if (!containsFiles(Array.from(event.dataTransfer.types))) return;
    event.preventDefault();
    event.stopPropagation();
    setIsFileDragging(true);
  };

  const getFileDropIndicator = (
    event: DragEvent<HTMLDivElement>,
  ): FileDropIndicator => {
    const canvasRect = event.currentTarget.getBoundingClientRect();
    const target = nearestEditorElement(
      event.currentTarget,
      event.clientX,
      event.clientY,
    );

    if (!target) {
      return {
        targetElementId: null,
        position: 'after',
        left: event.currentTarget.scrollLeft + 48,
        top: event.currentTarget.scrollTop + 48,
        width: Math.max(0, event.currentTarget.clientWidth - 96),
        height: 0,
        replaceImage: false,
      };
    }

    const targetRect = target.getBoundingClientRect();
    const replaceImage = target.dataset.editorElementType === 'image';
    const position: DropPosition =
      event.clientY < targetRect.top + targetRect.height / 2
        ? 'before'
        : 'after';

    return {
      targetElementId: target.dataset.editorElementId ?? null,
      position,
      left:
        targetRect.left
        - canvasRect.left
        + event.currentTarget.scrollLeft,
      top:
        (replaceImage || position === 'before'
          ? targetRect.top
          : targetRect.bottom)
        - canvasRect.top
        + event.currentTarget.scrollTop,
      width: targetRect.width,
      height: replaceImage ? targetRect.height : 0,
      replaceImage,
    };
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (isTerraGravityDrag()) return;
    if (!containsFiles(Array.from(event.dataTransfer.types))) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setFileDropIndicator(getFileDropIndicator(event));
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (
      event.relatedTarget instanceof Node
      && event.currentTarget.contains(event.relatedTarget)
    ) return;

    setIsFileDragging(false);
    setFileDropIndicator(null);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (isTerraGravityDrag()) {
      event.preventDefault();
      event.stopPropagation();
      setIsFileDragging(false);
      setFileDropIndicator(null);
      return;
    }

    if (!containsFiles(Array.from(event.dataTransfer.types))) return;

    event.preventDefault();
    event.stopPropagation();
    setIsFileDragging(false);
    const dropIndicator = getFileDropIndicator(event);
    setFileDropIndicator(null);

    const imageFiles = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );
    if (imageFiles.length === 0) return;

    void onDropImageFiles(
      imageFiles,
      dropIndicator.targetElementId,
      dropIndicator.position,
    );
  };

  return {
    canDrop: layoutDropTarget.isOver,
    drop: layoutDropTarget.dropTargetRef,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleMouseOver,
    hoveredElement,
    fileDropIndicator,
    isFileDragging,
    isOver: layoutDropTarget.isOver,
    justDropped: droppedFeedback.isActive,
    setHoveredElement,
    showError: false,
  };
}
