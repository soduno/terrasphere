import type {
  EditorElement,
  EditorElementProperties,
  EditorPropertyChange,
} from '../../types/editor';

export function createEditorPropertyUpdates(
  element: EditorElement,
  updateElement: (id: string, updates: Partial<EditorElement>) => void,
) {
  const updateProperties = (
    updates: Partial<EditorElementProperties>,
  ) => {
    updateElement(element.id, {
      properties: { ...element.properties, ...updates },
    });
  };

  const updateProperty: EditorPropertyChange = (property, value) => {
    updateProperties({ [property]: value });
  };

  return { updateProperties, updateProperty };
}
