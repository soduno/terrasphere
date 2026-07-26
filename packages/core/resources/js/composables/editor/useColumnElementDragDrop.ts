import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
  COLUMN_ELEMENT_DRAG_TYPE,
  type ColumnDropItem,
  type ColumnElementDragItem,
  type DropPosition,
  type EditorElement,
  type UseColumnElementDragDropOptions,
} from '../../types/editor';

type DropResult = { handled: true } | void;

function createEmbeddedImage(element: EditorElement) {
  const image = document.createElement('img');
  image.src = element.properties.imageUrl || '';
  image.alt = 'Content';
  image.draggable = false;
  image.dataset.editorEmbeddedImage =
    `embedded-image-${Date.now()}-${Math.random()}`;
  image.style.display = 'block';
  image.style.maxWidth = '100%';
  image.style.width = element.properties.imageWidth || '60%';
  image.style.height = element.properties.imageHeight || 'auto';
  image.style.borderRadius =
    `${element.properties.borderRadius || 0}px`;

  const alignment = element.properties.imageAlign;
  image.style.marginLeft = alignment === 'left' ? '0' : 'auto';
  image.style.marginRight = alignment === 'right' ? '0' : 'auto';
  return image;
}

export function useColumnElementDragDrop({
  element,
  index,
  parentId,
  columnIndex,
  elementRef,
  editableRef,
  embeddedImageId,
  setDraftContent,
  onUpdate,
  onSelect,
  onMove,
  onInsertNew,
  positionEmbeddedImage,
}: UseColumnElementDragDropOptions) {
  const [dropPosition, setDropPosition] =
    useState<DropPosition>('before');
  const [embeddedDropY, setEmbeddedDropY] = useState<number | null>(null);
  const [embeddedInsertionIndex, setEmbeddedInsertionIndex] = useState(0);
  const [imageDropPoint, setImageDropPoint] = useState<{
    localY: number;
    insertionIndex: number;
  } | null>(null);
  const embeddedDragType = `embedded-image-${element.id}`;

  const contentInsertionPoint = (clientY: number) => {
    const target = editableRef.current;
    const root = elementRef.current;
    if (!target || !root) return { localY: 0, insertionIndex: 0 };

    const rootBounds = root.getBoundingClientRect();
    const targetBounds = target.getBoundingClientRect();
    const children = Array.from(target.children);
    const boundaries = children.length > 0
      ? [
          children[0].getBoundingClientRect().top,
          ...children.map((child) => child.getBoundingClientRect().bottom),
        ]
      : [targetBounds.top, targetBounds.bottom];
    let insertionIndex = 0;

    boundaries.forEach((boundary, boundaryIndex) => {
      if (
        Math.abs(clientY - boundary)
        < Math.abs(clientY - boundaries[insertionIndex])
      ) {
        insertionIndex = boundaryIndex;
      }
    });

    return {
      insertionIndex,
      localY: Math.max(
        0,
        Math.min(
          boundaries[insertionIndex] - rootBounds.top,
          rootBounds.height,
        ),
      ),
    };
  };

  const insertAtContentBoundary = (
    node: Node,
    insertionIndex: number,
  ) => {
    const target = editableRef.current;
    if (!target) return;

    const children = Array.from(target.children);
    const reference = children[insertionIndex] ?? null;
    if (reference) target.insertBefore(node, reference);
    else target.appendChild(node);
  };

  const saveContent = () => {
    if (!editableRef.current) return;
    const content = editableRef.current.innerHTML;
    setDraftContent(content);
    onUpdate(element.id, { content });
  };

  const [{ isDragging }, drag, preview] = useDrag<
    ColumnElementDragItem,
    void,
    { isDragging: boolean }
  >({
    type: COLUMN_ELEMENT_DRAG_TYPE,
    item: {
      elementId: element.id,
      sourceParentId: parentId,
      sourceColumnIndex: columnIndex,
      sourceIndex: index,
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  const [, embeddedDrag] = useDrag({
    type: embeddedDragType,
    item: () => ({ embeddedImageId }),
    canDrag: () => !!embeddedImageId,
  });
  const [dropState, drop] = useDrop<
    ColumnDropItem,
    DropResult,
    {
      isOverTarget: boolean;
      isOverImageTarget: boolean;
      isOverEmbeddedTarget: boolean;
      isOverNewElementTarget: boolean;
    }
  >({
    accept: [COLUMN_ELEMENT_DRAG_TYPE, 'new-element', embeddedDragType],
    canDrop: (item, monitor) => {
      if (monitor.getItemType() === COLUMN_ELEMENT_DRAG_TYPE) return true;
      if (monitor.getItemType() === embeddedDragType) {
        return !!item.embeddedImageId;
      }
      return !item.isLayout;
    },
    hover: (item, monitor) => {
      const pointer = monitor.getClientOffset();
      if (!elementRef.current || !pointer) return;

      if (monitor.getItemType() === embeddedDragType) {
        const insertion = contentInsertionPoint(pointer.y);
        setEmbeddedDropY(insertion.localY);
        setEmbeddedInsertionIndex(insertion.insertionIndex);
        return;
      }

      if (
        monitor.getItemType() === 'new-element'
        && item.elementType === 'image'
        && (element.type === 'text' || element.type === 'wysiwyg')
      ) {
        setImageDropPoint(contentInsertionPoint(pointer.y));
        return;
      }

      const bounds = elementRef.current.getBoundingClientRect();
      const position =
        pointer.y < bounds.top + bounds.height / 2 ? 'before' : 'after';
      item.dropPosition = position;
      setDropPosition(position);
    },
    drop: (item, monitor) => {
      if (monitor.getItemType() === embeddedDragType) {
        const target = editableRef.current;
        const image = item.embeddedImageId
          ? target?.querySelector<HTMLImageElement>(
              `img[data-editor-embedded-image="${item.embeddedImageId}"]`,
            )
          : null;
        if (!target || !image) return;

        const previousParent = image.parentElement;
        insertAtContentBoundary(image, embeddedInsertionIndex);
        if (
          previousParent
          && previousParent !== target
          && !previousParent.textContent?.trim()
          && !previousParent.querySelector('img')
        ) previousParent.remove();

        saveContent();
        requestAnimationFrame(() => positionEmbeddedImage(image));
        setEmbeddedDropY(null);
        return { handled: true };
      }

      if (monitor.getItemType() === 'new-element') {
        if (!item.createElement) return;
        const newElement = item.createElement();
        const shouldEmbedImage =
          item.elementType === 'image'
          && (element.type === 'text' || element.type === 'wysiwyg')
          && !!newElement.properties.imageUrl;

        if (!shouldEmbedImage) {
          const insertionIndex =
            (item.dropPosition ?? dropPosition) === 'after'
              ? index + 1
              : index;
          onInsertNew(newElement, insertionIndex);
          return { handled: true };
        }

        if (!editableRef.current || !imageDropPoint) return;
        const image = createEmbeddedImage(newElement);
        insertAtContentBoundary(image, imageDropPoint.insertionIndex);
        saveContent();
        onSelect();
        requestAnimationFrame(() => positionEmbeddedImage(image));
        setImageDropPoint(null);
        return { handled: true };
      }

      if (
        !item.elementId
        || item.sourceParentId === undefined
        || item.sourceColumnIndex === undefined
        || item.sourceIndex === undefined
      ) return;
      if (item.elementId === element.id) return { handled: true };

      const insertionIndex =
        (item.dropPosition ?? dropPosition) === 'after'
          ? index + 1
          : index;
      onMove(item as ColumnElementDragItem, insertionIndex);
      return { handled: true };
    },
    collect: (monitor) => ({
      isOverTarget:
        monitor.isOver({ shallow: true })
        && monitor.getItemType() === COLUMN_ELEMENT_DRAG_TYPE,
      isOverImageTarget:
        monitor.isOver({ shallow: true })
        && monitor.getItemType() === 'new-element'
        && monitor.getItem()?.elementType === 'image',
      isOverEmbeddedTarget:
        monitor.isOver({ shallow: true })
        && monitor.getItemType() === embeddedDragType,
      isOverNewElementTarget:
        monitor.isOver({ shallow: true })
        && monitor.getItemType() === 'new-element'
        && !(
          monitor.getItem()?.elementType === 'image'
          && (element.type === 'text' || element.type === 'wysiwyg')
        ),
    }),
  });

  preview(drop(elementRef));

  return {
    ...dropState,
    drag,
    embeddedDrag,
    dropPosition,
    embeddedDropY,
    imageDropPoint,
    isDragging,
  };
}
