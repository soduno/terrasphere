import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical } from 'lucide-react';
import type {
  PropertySectionId,
  PropertySectionProps,
} from '../../../types/editor';
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
  const handleRef = useRef<HTMLButtonElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: 'property-section',
    item: { id: sectionId, index: position },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  const [, drop] = useDrop({
    accept: 'property-section',
    hover: (
      item: { id: PropertySectionId; index: number },
      monitor,
    ) => {
      if (!sectionRef.current || item.id === sectionId) return;

      const pointer = monitor.getClientOffset();
      if (!pointer) return;

      const bounds = sectionRef.current.getBoundingClientRect();
      const pointerOffset = pointer.y - bounds.top;
      const middle = (bounds.bottom - bounds.top) / 2;
      if (item.index < position && pointerOffset < middle) return;
      if (item.index > position && pointerOffset > middle) return;

      onMove(item.index, position);
      item.index = position;
    },
    drop: onDrop,
  });

  drag(handleRef);
  drop(sectionRef);

  return (
    <div
      ref={sectionRef}
      style={{ order: position }}
      className={isDragging ? 'relative opacity-40' : 'relative opacity-100'}
    >
      <button
        ref={handleRef}
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
