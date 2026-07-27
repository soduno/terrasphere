import { useRef, useState } from 'react';
import {
  useGravitySource,
  useGravityTarget,
} from '../../components/editor/terra-gravity/TerraGravity';
import type {
  DropPosition,
  EditorDragPayload,
  EditorElement,
  UseColumnElementDragDropOptions,
} from '../../types/editor';

type ColumnTargetPayload = Extract<
  EditorDragPayload,
  {
    kind:
      | 'root-element'
      | 'column-element'
      | 'sidebar-element'
      | 'embedded-image';
  }
>;

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
  const dropPositionRef = useRef<DropPosition>('before');
  const [embeddedDropY, setEmbeddedDropY] = useState<number | null>(null);
  const embeddedInsertionIndexRef = useRef(0);
  const [imageDropPoint, setImageDropPoint] = useState<{
    localY: number;
    insertionIndex: number;
  } | null>(null);
  const imageDropPointRef = useRef<{
    localY: number;
    insertionIndex: number;
  } | null>(null);

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

  const elementDragSource = useGravitySource({
    payload: {
      kind: 'column-element',
      elementId: element.id,
      sourceParentId: parentId,
      sourceColumnIndex: columnIndex,
      sourceIndex: index,
    },
    previewLabel: 'Move element',
  });
  const embeddedImageDragSource = useGravitySource({
    payload: {
      kind: 'embedded-image',
      ownerElementId: element.id,
      embeddedImageId: embeddedImageId ?? '',
    },
    disabled: !embeddedImageId,
    previewLabel: 'Move image',
  });
  const dropTarget = useGravityTarget<ColumnTargetPayload>({
    accepts: (payload): payload is ColumnTargetPayload => {
      if (
        payload.kind === 'root-element'
        || payload.kind === 'column-element'
      ) return payload.elementId !== element.id;
      if (payload.kind === 'embedded-image') {
        return (
          payload.ownerElementId === element.id
          && Boolean(payload.embeddedImageId)
        );
      }
      return payload.kind === 'sidebar-element';
    },
    onMove: ({ payload, point, rect }) => {
      if (payload.kind === 'embedded-image') {
        const insertion = contentInsertionPoint(point.y);
        embeddedInsertionIndexRef.current = insertion.insertionIndex;
        setEmbeddedDropY(insertion.localY);
        return;
      }

      if (
        payload.kind === 'sidebar-element'
        && payload.elementType === 'image'
        && (element.type === 'text' || element.type === 'wysiwyg')
      ) {
        const insertion = contentInsertionPoint(point.y);
        imageDropPointRef.current = insertion;
        setImageDropPoint(insertion);
        return;
      }

      const position =
        point.y < rect.top + rect.height / 2 ? 'before' : 'after';
      dropPositionRef.current = position;
      setDropPosition(position);
    },
    onDrop: ({ payload }) => {
      if (payload.kind === 'embedded-image') {
        const target = editableRef.current;
        const image = target?.querySelector<HTMLImageElement>(
          `img[data-editor-embedded-image="${payload.embeddedImageId}"]`,
        );
        if (!target || !image) return;

        const previousParent = image.parentElement;
        insertAtContentBoundary(
          image,
          embeddedInsertionIndexRef.current,
        );
        if (
          previousParent
          && previousParent !== target
          && !previousParent.textContent?.trim()
          && !previousParent.querySelector('img')
        ) previousParent.remove();

        saveContent();
        requestAnimationFrame(() => positionEmbeddedImage(image));
        setEmbeddedDropY(null);
        return;
      }

      if (payload.kind === 'sidebar-element') {
        const newElement = payload.createElement();
        const shouldEmbedImage =
          payload.elementType === 'image'
          && (element.type === 'text' || element.type === 'wysiwyg')
          && Boolean(newElement.properties.imageUrl);

        if (!shouldEmbedImage) {
          onInsertNew(
            newElement,
            dropPositionRef.current === 'after' ? index + 1 : index,
          );
          return;
        }

        const insertion = imageDropPointRef.current;
        if (!editableRef.current || !insertion) return;
        const image = createEmbeddedImage(newElement);
        insertAtContentBoundary(image, insertion.insertionIndex);
        saveContent();
        onSelect();
        requestAnimationFrame(() => positionEmbeddedImage(image));
        imageDropPointRef.current = null;
        setImageDropPoint(null);
        return;
      }

      onMove(
        payload,
        dropPositionRef.current === 'after' ? index + 1 : index,
      );
    },
    onLeave: () => {
      setEmbeddedDropY(null);
      imageDropPointRef.current = null;
      setImageDropPoint(null);
    },
  });

  const activePayload = dropTarget.payload;

  return {
    isOverTarget:
      dropTarget.isOver
      && (
        activePayload?.kind === 'root-element'
        || activePayload?.kind === 'column-element'
      ),
    isOverImageTarget:
      dropTarget.isOver
      && activePayload?.kind === 'sidebar-element'
      && activePayload.elementType === 'image',
    isOverEmbeddedTarget:
      dropTarget.isOver && activePayload?.kind === 'embedded-image',
    isOverNewElementTarget:
      dropTarget.isOver
      && activePayload?.kind === 'sidebar-element'
      && !(
        activePayload.elementType === 'image'
        && (element.type === 'text' || element.type === 'wysiwyg')
      ),
    drag: elementDragSource.dragHandleRef,
    embeddedDrag: embeddedImageDragSource.dragHandleRef,
    dropTargetRef: dropTarget.dropTargetRef,
    dropPosition,
    embeddedDropY,
    imageDropPoint,
    isDragging: elementDragSource.isDragging,
  };
}
