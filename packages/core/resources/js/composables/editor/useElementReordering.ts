import { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type {
  DropPosition,
  ElementDragItem,
  UseElementReorderingOptions,
} from '../../types/editor';

export function useElementReordering({
  index,
  onMove,
}: UseElementReorderingOptions) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition>('before');
  const [{ isDragging }, drag, preview] = useDrag<
    ElementDragItem,
    void,
    { isDragging: boolean }
  >({
    type: 'element',
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  const [{ isOverTarget }, drop] = useDrop<
    ElementDragItem,
    void,
    { isOverTarget: boolean }
  >({
    accept: 'element',
    hover: (item, monitor) => {
      const pointer = monitor.getClientOffset();
      if (!elementRef.current || !pointer) return;

      const bounds = elementRef.current.getBoundingClientRect();
      const position = pointer.y < bounds.top + bounds.height / 2
        ? 'before'
        : 'after';
      item.dropPosition = position;
      setDropPosition(position);
    },
    drop: (item) => {
      if (item.index === index) return;

      const insertionIndex =
        (item.dropPosition ?? dropPosition) === 'after'
          ? index + 1
          : index;
      onMove(item.index, insertionIndex);
    },
    collect: (monitor) => ({
      isOverTarget: monitor.isOver({ shallow: true }),
    }),
  });

  preview(drop(elementRef));

  return {
    elementRef,
    drag,
    dropPosition,
    isDragging,
    isOverTarget,
  };
}
