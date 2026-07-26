import { useState } from 'react';
import { api } from '@adapter/api';

export function useEditorPropertyOrder<T extends string>(initialOrder: T[]) {
  const [order, setOrder] = useState(initialOrder);

  const updateOrder = async (nextOrder: T[]) => {
    setOrder(nextOrder);

    try {
      await api.put(
        '/admin/user-settings/editor/property-order',
        { property_section_order: nextOrder },
      );
    } catch {
      // Keep the optimistic order for this session if persistence is unavailable.
    }
  };

  return {
    order,
    updateOrder,
  };
}
