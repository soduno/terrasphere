import type {
  EditorElementDragItem,
  EditorElement,
  UseContainerColumnsOptions,
} from '../../types/editor';
import { cloneEditorElement } from './elementTree';

function columnChildIndexes(
  children: EditorElement[],
  columnIndex: number,
) {
  return children.reduce<number[]>((indexes, child, index) => {
    if ((child.columnIndex ?? 0) === columnIndex) indexes.push(index);
    return indexes;
  }, []);
}

export function useContainerColumns({
  element,
  onUpdate,
  onMoveElementToColumn,
}: UseContainerColumnsOptions) {
  const updateChildren = (children: EditorElement[]) => {
    onUpdate(element.id, { children });
  };

  const addToColumn = (
    columnIndex: number,
    newElement: EditorElement,
    insertionIndex?: number,
  ) => {
    const children = [...(element.children ?? [])];
    const child = { ...newElement, columnIndex };

    if (insertionIndex === undefined) {
      children.push(child);
      updateChildren(children);
      return;
    }

    const indexes = columnChildIndexes(children, columnIndex);
    const globalIndex =
      indexes[insertionIndex]
      ?? (indexes.at(-1) !== undefined ? indexes.at(-1)! + 1 : children.length);
    children.splice(globalIndex, 0, child);
    updateChildren(children);
  };

  const duplicateChild = (childId: string) => {
    const children = [...(element.children ?? [])];
    const childIndex = children.findIndex((child) => child.id === childId);
    if (childIndex < 0) return;

    const source = children[childIndex];
    children.splice(childIndex + 1, 0, cloneEditorElement(source));
    updateChildren(children);
  };

  const deleteChild = (childId: string) => {
    updateChildren(
      (element.children ?? []).filter((child) => child.id !== childId),
    );
  };

  const moveChild = (
    columnIndex: number,
    item: EditorElementDragItem,
    insertionIndex: number,
  ) => {
    onMoveElementToColumn(
      item,
      element.id,
      columnIndex,
      insertionIndex,
    );
  };

  return {
    addToColumn,
    deleteChild,
    duplicateChild,
    moveChild,
  };
}
