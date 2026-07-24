export type ElementType = 
  | 'heading' 
  | 'text' 
  | 'wysiwyg'
  | 'image' 
  | 'calendar'
  | 'flex' 
  | 'grid';

export interface EditorElement {
  id: string;
  type: ElementType;
  content?: string;
  properties: {
    padding?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingLinked?: boolean;
    margin?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    marginLinked?: boolean;
    backgroundColor?: string;
    float?: 'none' | 'left' | 'right';
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: string;
    color?: string;
    borderRadius?: string;
    imageUrl?: string;
    imageWidth?: string;
    imageHeight?: string;
    imageAlign?: 'left' | 'center' | 'right';
    contentAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'center' | 'bottom';
    width?: string;
    columnGap?: string;
    columnCount?: number;
  };
  children?: EditorElement[];
  columnIndex?: number;
}

export const COLUMN_ELEMENT_DRAG_TYPE = 'column-element';

export interface ColumnElementDragItem {
  elementId: string;
  sourceParentId: string;
  sourceColumnIndex: number;
  sourceIndex: number;
  dropPosition?: 'before' | 'after';
}

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
          children: node.children.filter((_, index) => index !== directChildIndex),
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
        const targetIndexes = children.reduce<number[]>((indexes, child, index) => {
          if ((child.columnIndex ?? 0) === targetColumnIndex) indexes.push(index);
          return indexes;
        }, []);
        const localIndex = Math.max(
          0,
          Math.min(adjustedInsertionIndex, targetIndexes.length)
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

export const DEFAULT_PROPERTIES = {
  padding: '0',
  paddingLinked: true,
  margin: '0',
  marginLinked: true,
  backgroundColor: 'transparent',
  float: 'none' as const,
  textAlign: 'left' as const,
  contentAlign: 'left' as const,
  verticalAlign: 'top' as const,
  fontSize: '16',
  color: '#000000',
  borderRadius: '0',
  columnGap: '20',
};
