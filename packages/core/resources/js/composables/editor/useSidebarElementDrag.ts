import { useDrag } from 'react-dnd';
import type {
  NewEditorElementDragItem,
  UseSidebarElementDragOptions,
} from '../../types/editor';

export function useSidebarElementDrag({
  element,
  onCreate,
  canDrag,
}: UseSidebarElementDragOptions) {
  const isLayout = element.type === 'flex' || element.type === 'grid';
  const [{ isDragging }, drag] = useDrag<
    NewEditorElementDragItem,
    void,
    { isDragging: boolean }
  >({
    type: 'new-element',
    item: () => ({
      elementType: element.type,
      createElement: (columnCount) => onCreate(element.type, columnCount),
      isLayout,
    }),
    canDrag: () => canDrag,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  return { drag, isDragging, isLayout };
}
