import { useRef, useState } from 'react';
import {
  PROPERTY_SECTION_IDS,
  type PropertySectionId,
  type PropertySectionProps,
} from '../../types/editor';

export function normalizePropertySectionOrder(
  order: readonly string[],
): PropertySectionId[] {
  const validIds = new Set<PropertySectionId>(PROPERTY_SECTION_IDS);
  const savedIds = order.filter(
    (id): id is PropertySectionId => validIds.has(id as PropertySectionId),
  );

  return [...new Set([...savedIds, ...PROPERTY_SECTION_IDS])];
}

export function usePropertySectionOrder(
  initialOrder: readonly string[],
  onOrderChange: (order: PropertySectionId[]) => void,
) {
  const [sectionOrder, setSectionOrder] = useState(
    () => normalizePropertySectionOrder(initialOrder),
  );
  const sectionOrderRef = useRef(sectionOrder);

  const moveSection = (dragIndex: number, hoverIndex: number) => {
    setSectionOrder((currentOrder) => {
      const nextOrder = [...currentOrder];
      const [draggedSection] = nextOrder.splice(dragIndex, 1);
      if (!draggedSection) return currentOrder;

      nextOrder.splice(hoverIndex, 0, draggedSection);
      sectionOrderRef.current = nextOrder;
      return nextOrder;
    });
  };

  const sortableSectionProps = (
    sectionId: PropertySectionId,
  ): Omit<PropertySectionProps, 'title' | 'children'> => ({
    sectionId,
    position: sectionOrder.indexOf(sectionId),
    onMove: moveSection,
    onDrop: () => onOrderChange(sectionOrderRef.current),
  });

  return { sortableSectionProps };
}
