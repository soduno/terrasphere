import { useGravitySource } from '../../components/editor/terra-gravity/TerraGravity';
import type { UseSidebarElementDragOptions } from '../../types/editor';

export function useSidebarElementDrag({
  element,
  onCreate,
  canDrag,
}: UseSidebarElementDragOptions) {
  const isLayout = element.type === 'flex' || element.type === 'grid';
  const dragSource = useGravitySource({
    payload: {
      kind: 'sidebar-element',
      elementType: element.type,
      createElement: (columnCount) => onCreate(element.type, columnCount),
      isLayout,
    },
    disabled: !canDrag,
    previewLabel: `Add ${element.label}`,
  });

  return {
    drag: dragSource.dragHandleRef,
    isDragging: dragSource.isDragging,
    isLayout,
  };
}
