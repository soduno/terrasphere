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
  ColumnElementDragItem,
  EditorElement,
} from '../../types/editor';

export function useEditorElements(initialElements: EditorElement[]) {
  const [elements, setElements] = useState(initialElements);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const addElement = (element: EditorElement) => {
    setElements((currentElements) => [...currentElements, element]);
  };

  const insertImages = (urls: string[], targetElementId: string | null) => {
    const imageElements = createUploadedImageElements(urls);

    setElements((currentElements) =>
      insertUploadedImages(
        currentElements,
        imageElements,
        targetElementId,
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

  const moveElement = (dragIndex: number, insertionIndex: number) => {
    setElements((currentElements) =>
      moveEditorElement(currentElements, dragIndex, insertionIndex)
    );
  };

  const moveElementToColumn = (
    item: ColumnElementDragItem,
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
