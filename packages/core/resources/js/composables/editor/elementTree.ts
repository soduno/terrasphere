import type {
  ColumnElementDragItem,
  EditorElement,
  TreeInsertionResult,
} from '../../types/editor';

export function moveElementBetweenColumns(
  elements: EditorElement[],
  item: ColumnElementDragItem,
  targetParentId: string,
  targetColumnIndex: number,
  insertionIndex: number,
): EditorElement[] {
  let movedElement: EditorElement | undefined;

  const removeElement = (nodes: EditorElement[]): EditorElement[] =>
    nodes.map((node) => {
      const directChildIndex = node.children?.findIndex(
        (child) => child.id === item.elementId
      ) ?? -1;

      if (directChildIndex >= 0 && node.children) {
        movedElement = node.children[directChildIndex];
        return {
          ...node,
          children: node.children.filter(
            (_, index) => index !== directChildIndex,
          ),
        };
      }

      if (!node.children?.length) return node;

      const children = removeElement(node.children);
      return children === node.children ? node : { ...node, children };
    });

  const withoutElement = removeElement(elements);
  if (!movedElement) return elements;

  const adjustedInsertionIndex =
    item.sourceParentId === targetParentId
    && item.sourceColumnIndex === targetColumnIndex
    && item.sourceIndex < insertionIndex
      ? insertionIndex - 1
      : insertionIndex;
  let inserted = false;

  const insertElement = (nodes: EditorElement[]): EditorElement[] =>
    nodes.map((node) => {
      if (node.id === targetParentId) {
        const children = [...(node.children || [])];
        const targetIndexes = children.reduce<number[]>(
          (indexes, child, index) => {
            if ((child.columnIndex ?? 0) === targetColumnIndex) {
              indexes.push(index);
            }
            return indexes;
          },
          [],
        );
        const localIndex = Math.max(
          0,
          Math.min(adjustedInsertionIndex, targetIndexes.length),
        );
        const globalIndex =
          targetIndexes[localIndex]
          ?? (targetIndexes.length > 0
            ? targetIndexes[targetIndexes.length - 1] + 1
            : children.length);

        children.splice(globalIndex, 0, {
          ...movedElement!,
          columnIndex: targetColumnIndex,
        });
        inserted = true;
        return { ...node, children };
      }

      if (!node.children?.length) return node;
      return { ...node, children: insertElement(node.children) };
    });

  const movedElements = insertElement(withoutElement);
  return inserted ? movedElements : elements;
}

export function findEditorElement(
  elements: EditorElement[],
  id: string | null,
): EditorElement | undefined {
  if (!id) return undefined;

  for (const element of elements) {
    if (element.id === id) return element;

    const child = findEditorElement(element.children || [], id);
    if (child) return child;
  }

  return undefined;
}

export function updateEditorElement(
  elements: EditorElement[],
  id: string,
  updates: Partial<EditorElement>,
): EditorElement[] {
  return elements.map((element) => {
    if (element.id === id) {
      return { ...element, ...updates };
    }

    if (!element.children) return element;

    return {
      ...element,
      children: updateEditorElement(element.children, id, updates),
    };
  });
}

export function deleteEditorElement(
  elements: EditorElement[],
  id: string,
): EditorElement[] {
  return elements
    .filter((element) => element.id !== id)
    .map((element) => {
      if (!element.children) return element;

      return {
        ...element,
        children: deleteEditorElement(element.children, id),
      };
    });
}

export function moveEditorElement(
  elements: EditorElement[],
  dragIndex: number,
  insertionIndex: number,
): EditorElement[] {
  const nextElements = [...elements];
  const [draggedElement] = nextElements.splice(dragIndex, 1);
  if (!draggedElement) return elements;

  const adjustedIndex = dragIndex < insertionIndex
    ? insertionIndex - 1
    : insertionIndex;
  nextElements.splice(adjustedIndex, 0, draggedElement);

  return nextElements;
}

export function duplicateEditorElement(
  elements: EditorElement[],
  id: string,
): EditorElement[] {
  const index = elements.findIndex((element) => element.id === id);
  if (index < 0) return elements;

  const clone = structuredClone(elements[index]);
  clone.id = `element-${Date.now()}`;

  const nextElements = [...elements];
  nextElements.splice(index + 1, 0, clone);
  return nextElements;
}

export function createUploadedImageElements(urls: string[]): EditorElement[] {
  const timestamp = Date.now();
  return urls.map((url, index) => ({
    id: `col-element-${timestamp}-${index}-${Math.random()}`,
    type: 'image',
    properties: {
      imageUrl: url,
      imageWidth: '60%',
      imageHeight: 'auto',
      imageAlign: 'center',
      contentAlign: 'center',
    },
    columnIndex: 0,
  }));
}

export function insertUploadedImages(
  elements: EditorElement[],
  imageElements: EditorElement[],
  targetElementId: string | null,
): EditorElement[] {
  const insertNearTarget = (nodes: EditorElement[]): TreeInsertionResult => {
    let inserted = false;

    const nextNodes = nodes.map((node) => {
      if (inserted) return node;

      if (
        node.id === targetElementId
        && (node.type === 'flex' || node.type === 'grid')
      ) {
        inserted = true;
        return {
          ...node,
          children: [...(node.children || []), ...imageElements],
        };
      }

      const targetChildIndex = node.children?.findIndex(
        (child) => child.id === targetElementId,
      ) ?? -1;

      if (targetChildIndex >= 0 && node.children) {
        const targetColumn = node.children[targetChildIndex].columnIndex ?? 0;
        inserted = true;

        return {
          ...node,
          children: [
            ...node.children.slice(0, targetChildIndex + 1),
            ...imageElements.map((image) => ({
              ...image,
              columnIndex: targetColumn,
            })),
            ...node.children.slice(targetChildIndex + 1),
          ],
        };
      }

      if (node.children?.length) {
        const nestedResult = insertNearTarget(node.children);

        if (nestedResult.inserted) {
          inserted = true;
          return { ...node, children: nestedResult.nodes };
        }
      }

      return node;
    });

    return { nodes: nextNodes, inserted };
  };

  const insertionResult = targetElementId
    ? insertNearTarget(elements)
    : { nodes: elements, inserted: false };
  const nextElements = insertionResult.nodes;

  if (insertionResult.inserted) {
    return nextElements;
  }

  const firstContainerIndex = nextElements.findIndex(
    (element) => element.type === 'flex' || element.type === 'grid',
  );

  if (firstContainerIndex >= 0) {
    const container = nextElements[firstContainerIndex];
    const nextWithImages = [...nextElements];
    nextWithImages[firstContainerIndex] = {
      ...container,
      children: [...(container.children || []), ...imageElements],
    };

    return nextWithImages;
  }

  return [
    ...nextElements,
    {
      id: `element-${Date.now()}`,
      type: 'flex',
      properties: {
        width: '100%',
        padding: '0',
        margin: '0',
        backgroundColor: 'transparent',
        columnGap: '20',
        columnCount: 1,
      },
      children: imageElements,
    },
  ];
}
