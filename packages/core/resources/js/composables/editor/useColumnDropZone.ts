import { useRef, useState } from 'react';
import { useGravityTarget } from '../../components/editor/terra-gravity/TerraGravity';
import { useTransientFlag } from '../useTransientFlag';
import type {
  EditorDragPayload,
  UseColumnDropZoneOptions,
} from '../../types/editor';

type ColumnDropPayload = Extract<
  EditorDragPayload,
  { kind: 'sidebar-element' | 'root-element' | 'column-element' }
>;

export function useColumnDropZone({
  parentId,
  elementCount,
  emptyIndicatorTop = 12,
  onAddToColumn,
  onMoveElement,
}: UseColumnDropZoneOptions) {
  const droppedFeedback = useTransientFlag();
  const insertionIndexRef = useRef(0);
  const [indicatorTop, setIndicatorTop] = useState(emptyIndicatorTop);
  const dropTarget = useGravityTarget<ColumnDropPayload>({
    accepts: (payload): payload is ColumnDropPayload =>
      payload.kind === 'sidebar-element'
      || (
        (payload.kind === 'root-element' || payload.kind === 'column-element')
        && payload.elementId !== parentId
      ),
    onMove: ({ point, rect, target }) => {
      const itemContainer = target.querySelector<HTMLElement>(
        ':scope > [data-editor-column-items]',
      );
      const itemElements = itemContainer
        ? Array.from(itemContainer.children).filter(
            (child): child is HTMLElement =>
              child instanceof HTMLElement
              && child.dataset.editorElementId !== undefined,
          )
        : [];

      if (itemElements.length === 0) {
        insertionIndexRef.current = 0;
        setIndicatorTop(emptyIndicatorTop);
        return;
      }

      const boundaries = [
        itemElements[0].getBoundingClientRect().top,
        ...itemElements.map((item) => item.getBoundingClientRect().bottom),
      ];
      let nearestBoundaryIndex = 0;

      boundaries.forEach((boundary, index) => {
        if (
          Math.abs(point.y - boundary)
          < Math.abs(point.y - boundaries[nearestBoundaryIndex])
        ) {
          nearestBoundaryIndex = index;
        }
      });

      insertionIndexRef.current = nearestBoundaryIndex;
      setIndicatorTop(
        Math.max(
          0,
          Math.min(
            boundaries[nearestBoundaryIndex] - rect.top,
            rect.height,
          ),
        ),
      );
    },
    onDrop: ({ payload }) => {
      if (
        payload.kind === 'root-element'
        || payload.kind === 'column-element'
      ) {
        onMoveElement(payload, insertionIndexRef.current);
      } else {
        const newElement = payload.createElement();
        onAddToColumn(newElement, insertionIndexRef.current);
      }

      droppedFeedback.trigger();
    },
    onLeave: () => {
      insertionIndexRef.current = elementCount === 0 ? 0 : elementCount;
      setIndicatorTop(emptyIndicatorTop);
    },
  });

  return {
    canDrop: dropTarget.isOver,
    drop: dropTarget.dropTargetRef,
    isOver: dropTarget.isOver,
    indicatorTop,
    justDropped: droppedFeedback.isActive,
  };
}
