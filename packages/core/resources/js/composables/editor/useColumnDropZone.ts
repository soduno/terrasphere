import { useDrop } from 'react-dnd';
import { useTransientFlag } from '../useTransientFlag';
import {
  COLUMN_ELEMENT_DRAG_TYPE,
  type ColumnElementDragItem,
  type NewEditorElementDragItem,
  type UseColumnDropZoneOptions,
} from '../../types/editor';

type ColumnDropItem = NewEditorElementDragItem | ColumnElementDragItem;

export function useColumnDropZone({
  elementCount,
  onAddToColumn,
  onMoveElement,
}: UseColumnDropZoneOptions) {
  const droppedFeedback = useTransientFlag();
  const [{ isOver, canDrop }, drop] = useDrop<
    ColumnDropItem,
    { handled: true } | void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: ['new-element', COLUMN_ELEMENT_DRAG_TYPE],
    canDrop: (item) =>
      'elementId' in item || !item.isLayout,
    drop: (item, monitor) => {
      if (monitor.didDrop()) return { handled: true };

      if (monitor.getItemType() === COLUMN_ELEMENT_DRAG_TYPE) {
        onMoveElement(item as ColumnElementDragItem, elementCount);
      } else {
        const newElement =
          (item as NewEditorElementDragItem).createElement();
        newElement.id = `col-element-${Date.now()}-${Math.random()}`;
        onAddToColumn(newElement);
      }

      droppedFeedback.trigger();
      return { handled: true };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  return {
    canDrop,
    drop,
    isOver,
    justDropped: droppedFeedback.isActive,
  };
}
