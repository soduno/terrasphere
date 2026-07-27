import { useState } from 'react';
import {
  createUploadedImageElements,
  deleteEditorElement,
  duplicateEditorElement,
  findEditorElement,
  insertUploadedImages,
  moveEditorElement,
  updateEditorElement,
  moveElementBetweenColumns,
} from './elementTree';
import type {
  DropPosition,
  EditorElementDragItem,
  EditorElement,
} from '../../types/editor';

export function useEditorElements(initialElements: EditorElement[]) {
  const [elements, setElements] = useState(initialElements);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const addElement = (element: EditorElement) => {
    setElements((currentElements) => [...currentElements, element]);
  };

  const insertImages = (
    urls: string[],
    targetElementId: string | null,
    position: DropPosition = 'after',
  ) => {
    const targetElement = findEditorElement(elements, targetElementId);
    const imageElements = createUploadedImageElements(urls);

    if (targetElement?.type === 'image' && urls[0]) {
      setElements((currentElements) => {
        const currentTarget =
          findEditorElement(currentElements, targetElement.id) ?? targetElement;
        const nextElements = updateEditorElement(
          currentElements,
          targetElement.id,
          {
            properties: {
              ...currentTarget.properties,
              imageUrl: urls[0],
            },
          },
        );

        return imageElements.length > 1
          ? insertUploadedImages(
              nextElements,
              imageElements.slice(1),
              targetElement.id,
              'after',
            )
          : nextElements;
      });
      setSelectedElementId(targetElement.id);
      return;
    }

    setElements((currentElements) =>
      insertUploadedImages(
        currentElements,
        imageElements,
        targetElementId,
        position,
      )
    );
    setSelectedElementId(imageElements.at(-1)?.id ?? null);
  };

  const updateElement = (id: string, updates: Partial<EditorElement>) => {
    setElements((currentElements) =>
      updateEditorElement(currentElements, id, updates)
    );
  };

  const deleteElement = (id: string) => {
    setElements((currentElements) =>
      deleteEditorElement(currentElements, id)
    );
    setSelectedElementId((currentId) => currentId === id ? null : currentId);
  };

  const moveElement = (
    item: EditorElementDragItem,
    insertionIndex: number,
  ) => {
    setElements((currentElements) =>
      moveEditorElement(currentElements, item, insertionIndex)
    );
  };

  const moveElementToColumn = (
    item: EditorElementDragItem,
    targetParentId: string,
    targetColumnIndex: number,
    insertionIndex: number,
  ) => {
    setElements((currentElements) =>
      moveElementBetweenColumns(
        currentElements,
        item,
        targetParentId,
        targetColumnIndex,
        insertionIndex,
      )
    );
  };

  const duplicateElement = (id: string) => {
    setElements((currentElements) =>
      duplicateEditorElement(currentElements, id)
    );
  };

  return {
    elements,
    selectedElementId,
    selectedElement: findEditorElement(elements, selectedElementId),
    hasContainerElements: elements.some(
      (element) => element.type === 'flex' || element.type === 'grid',
    ),
    setSelectedElementId,
    addElement,
    insertImages,
    updateElement,
    deleteElement,
    moveElement,
    moveElementToColumn,
    duplicateElement,
  };
}
