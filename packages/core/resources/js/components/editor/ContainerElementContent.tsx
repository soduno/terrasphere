import { useContainerColumns } from '../../composables/editor/useContainerColumns';
import type { ContainerElementContentProps } from '../../types/editor';
import { ColumnDropZone } from './ColumnDropZone';
import { getEditorElementStyle } from './editorElementStyles';

export function ContainerElementContent({
  element,
  selectedElement,
  hoveredElement,
  onSelectElement,
  onUpdate,
  onMoveElementToColumn,
}: ContainerElementContentProps) {
  const columns = useContainerColumns({
    element,
    onUpdate,
    onMoveElementToColumn,
  });
  const columnCount = element.properties.columnCount || 1;

  return (
    <div
      id={element.properties.htmlId || undefined}
      className={element.properties.cssClass || undefined}
      data-editor-container-id={element.id}
      style={{
        ...getEditorElementStyle(element),
        display: element.type === 'grid' ? 'grid' : 'flex',
        width: element.properties.width,
        gridTemplateColumns:
          element.type === 'grid'
            ? `repeat(${columnCount}, minmax(0, 1fr))`
            : undefined,
        gap: `${element.properties.columnGap || 20}px`,
      }}
    >
      {Array.from({ length: columnCount }, (_, columnIndex) => (
        <ColumnDropZone
          key={`column-${element.id}-${columnIndex}`}
          columnIndex={columnIndex}
          parentId={element.id}
          elements={(element.children ?? []).filter(
            (child) => (child.columnIndex ?? 0) === columnIndex,
          )}
          selectedElement={selectedElement}
          hoveredElement={hoveredElement}
          onSelectElement={onSelectElement}
          onUpdate={onUpdate}
          elementGap={
            element.type === 'flex'
              ? element.properties.columnGap
              : element.properties.columnProperties?.[columnIndex]?.gap
                ?? '8'
          }
          matchRowHeight={element.type === 'grid'}
          columnProperties={
            element.type === 'grid'
              ? {
                  gap: '8',
                  padding: '12',
                  paddingLinked: true,
                  margin: '0',
                  marginLinked: true,
                  verticalAlign:
                    element.properties.columnVerticalAlignments?.[columnIndex]
                    ?? 'top',
                  ...element.properties.columnProperties?.[columnIndex],
                }
              : undefined
          }
          onAddToColumn={(child, insertionIndex) =>
            columns.addToColumn(columnIndex, child, insertionIndex)
          }
          onDuplicateFromColumn={columns.duplicateChild}
          onMoveElement={(item, insertionIndex) =>
            columns.moveChild(columnIndex, item, insertionIndex)
          }
          onMoveElementToColumn={onMoveElementToColumn}
          onDeleteFromColumn={columns.deleteChild}
        />
      ))}
    </div>
  );
}
