import { useRef } from 'react';
import { GripVertical } from 'lucide-react';
import type {
  EditorDragPayload,
  PropertySectionProps,
} from '../../../types/editor';
import {
  useGravitySource,
  useGravityTarget,
} from '../terra-gravity/TerraGravity';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../ui/accordion';

export function PropertySection({
  title,
  children,
  defaultOpen = false,
  sectionId,
  position,
  onMove,
  onDrop,
}: PropertySectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const dragSource = useGravitySource({
    payload: {
      kind: 'property-section',
      id: sectionId,
      index: position,
    },
    previewLabel: `Move ${title}`,
  });
  const dropTarget = useGravityTarget<
    Extract<EditorDragPayload, { kind: 'property-section' }>
  >({
    accepts: (
      payload,
    ): payload is Extract<
      EditorDragPayload,
      { kind: 'property-section' }
    > => payload.kind === 'property-section',
    onMove: ({ payload, point, rect }) => {
      if (payload.id === sectionId) return;

      const pointerOffset = point.y - rect.top;
      const middle = rect.height / 2;
      if (payload.index < position && pointerOffset < middle) return;
      if (payload.index > position && pointerOffset > middle) return;

      onMove(payload.index, position);
      payload.index = position;
    },
    onDrop,
  });

  return (
    <div
      ref={(node) => {
        sectionRef.current = node;
        dropTarget.dropTargetRef(node);
      }}
      style={{ order: position }}
      className={
        dragSource.isDragging
          ? 'relative opacity-40'
          : 'relative opacity-100'
      }
    >
      <button
        ref={dragSource.dragHandleRef}
        type="button"
        aria-label={`Drag to reorder ${title}`}
        title={`Drag to reorder ${title}`}
        className="absolute left-2.5 top-3.5 z-10 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:text-gray-500 dark:hover:text-gray-300"
      >
        <GripVertical className="size-3.5" />
      </button>
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpen ? 'content' : undefined}
        className="w-full"
      >
        <AccordionItem
          value="content"
          className="overflow-hidden rounded-xl border border-gray-200 bg-white px-4 shadow-sm last:border-b dark:border-gray-700 dark:bg-gray-900"
        >
          <AccordionTrigger className="py-3 pl-4 text-xs font-medium uppercase tracking-wide text-gray-600 hover:no-underline dark:text-gray-300">
            {title}
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            {children}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
