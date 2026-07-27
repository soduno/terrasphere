import { useRef, useState } from 'react';
import {
  useGravitySource,
  useGravityTarget,
} from '../../components/editor/terra-gravity/TerraGravity';
import type {
  DropPosition,
  EditorDragPayload,
  UseElementReorderingOptions,
} from '../../types/editor';

type RootElementPayload = Extract<
  EditorDragPayload,
  { kind: 'root-element' | 'column-element' }
>;

export function useElementReordering({
  elementId,
  index,
  onMove,
}: UseElementReorderingOptions) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [dropPosition, setDropPosition] =
    useState<DropPosition>('before');
  const dropPositionRef = useRef<DropPosition>('before');
  const dragSource = useGravitySource({
    payload: {
      kind: 'root-element',
      elementId,
      sourceParentId: null,
      sourceColumnIndex: null,
      sourceIndex: index,
    },
    previewLabel: 'Move element',
  });
  const dropTarget = useGravityTarget<RootElementPayload>({
    accepts: (payload): payload is RootElementPayload =>
      (
        payload.kind === 'root-element'
        || payload.kind === 'column-element'
      )
      && payload.elementId !== elementId,
    onMove: ({ point, rect }) => {
      const position =
        point.y < rect.top + rect.height / 2 ? 'before' : 'after';
      dropPositionRef.current = position;
      setDropPosition(position);
    },
    onDrop: ({ payload }) => {
      onMove(
        payload,
        dropPositionRef.current === 'after' ? index + 1 : index,
      );
    },
  });

  return {
    elementRef,
    drag: dragSource.dragHandleRef,
    dropPosition,
    dropTargetRef: dropTarget.dropTargetRef,
    isDragging: dragSource.isDragging,
    isOverTarget: dropTarget.isOver,
  };
}
