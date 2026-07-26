import { Image as ImageIcon } from 'lucide-react';
import { useContainerColumns } from '../../composables/editor/useContainerColumns';
import type { EditorElementContentProps } from '../../types/editor';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Calendar } from '../ui/calendar';
import { ColumnDropZone } from './ColumnDropZone';
import {
  getEditorElementStyle,
  getFlexAlignment,
} from './editorElementStyles';

export function EditorElementContent({
  element,
  selectedElement,
  hoveredElement,
  editableRef,
  isEditing,
  onDoubleClick,
  onInput,
  onBlur,
  onSelectElement,
  onUpdate,
  onMoveElementToColumn,
}: EditorElementContentProps) {
  const style = getEditorElementStyle(element);
  const columns = useContainerColumns({
    element,
    onUpdate,
    onMoveElementToColumn,
  });
  const editableClassName = [
    'outline-none transition-all',
    element.type === 'wysiwyg' ? 'min-h-[100px]' : '',
    isEditing ? 'ring-2 ring-indigo-500 rounded-lg' : 'cursor-text',
  ].filter(Boolean).join(' ');

  if (
    element.type === 'heading'
    || element.type === 'text'
    || element.type === 'wysiwyg'
  ) {
    return (
      <div
        ref={editableRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onDoubleClick={onDoubleClick}
        onInput={onInput}
        onBlur={onBlur}
        style={style}
        className={editableClassName}
      />
    );
  }

  if (element.type === 'image') {
    const alignment =
      element.properties.contentAlign ?? element.properties.imageAlign;

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          justifyContent: getFlexAlignment(alignment),
        }}
      >
        {element.properties.imageUrl ? (
          <ImageWithFallback
            src={element.properties.imageUrl}
            alt="Content"
            className="max-w-full rounded-xl object-cover"
            style={{
              width: element.properties.imageWidth || '60%',
              height: element.properties.imageHeight || 'auto',
              borderRadius: `${element.properties.borderRadius || 0}px`,
            }}
          />
        ) : (
          <div className="flex aspect-video w-full max-w-sm flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-900/60">
            <ImageIcon className="size-7" />
            <p className="mt-2 text-xs font-medium">
              Choose an image in Properties
            </p>
          </div>
        )}
      </div>
    );
  }

  if (element.type === 'calendar') {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          justifyContent: getFlexAlignment(element.properties.contentAlign),
        }}
      >
        <Calendar
          mode="single"
          className="rounded-xl border border-gray-200 shadow-sm dark:border-gray-700"
        />
      </div>
    );
  }

  if (element.type === 'flex' || element.type === 'grid') {
    const columnCount = element.properties.columnCount || 1;

    return (
      <div
        style={{
          ...style,
          display: element.type === 'flex' ? 'flex' : 'grid',
          width: element.properties.width,
          gridTemplateColumns:
            element.type === 'grid'
              ? `repeat(${columnCount}, 1fr)`
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
                : undefined
            }
            onAddToColumn={(child, insertionIndex) =>
              columns.addToColumn(columnIndex, child, insertionIndex)
            }
            onDuplicateFromColumn={columns.duplicateChild}
            onMoveElement={(item, insertionIndex) =>
              columns.moveChild(columnIndex, item, insertionIndex)
            }
            onDeleteFromColumn={columns.deleteChild}
          />
        ))}
      </div>
    );
  }

  return null;
}
