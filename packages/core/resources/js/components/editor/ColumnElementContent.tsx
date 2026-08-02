import { Image as ImageIcon } from 'lucide-react';
import type { ColumnElementContentProps } from '../../types/editor';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Calendar } from '../ui/calendar';
import { ContainerElementContent } from './ContainerElementContent';
import {
  getEditorElementStyle,
  getFlexAlignment,
} from './editorElementStyles';

export function ColumnElementContent({
  element,
  selectedElement,
  hoveredElement,
  editableRef,
  isEditing,
  onClick,
  onInput,
  onBlur,
  onSelectElement,
  onUpdate,
  onMoveElementToColumn,
}: ColumnElementContentProps) {
  const style = getEditorElementStyle(element, 14);
  const editableClassName = [
    'outline-none transition-all',
    isEditing ? 'ring-2 ring-indigo-500 rounded-lg' : 'cursor-text',
    element.properties.cssClass,
  ].filter(Boolean).join(' ');

  if (
    element.type === 'heading'
    || element.type === 'text'
    || element.type === 'wysiwyg'
  ) {
    return (
      <div
        id={element.properties.htmlId || undefined}
        ref={editableRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onClick={onClick}
        onInput={onInput}
        onBlur={onBlur}
        style={style}
        className={editableClassName}
      />
    );
  }

  if (element.type === 'image') {
    const floatDirection = element.properties.float || 'none';
    const alignment =
      element.properties.contentAlign ?? element.properties.imageAlign;

    return (
      <div
        id={element.properties.htmlId || undefined}
        className={element.properties.cssClass || undefined}
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
            draggable={false}
            className="max-w-full rounded-lg object-cover"
            style={{
              width:
                floatDirection === 'none'
                  ? element.properties.imageWidth || '60%'
                  : '100%',
              height: element.properties.imageHeight || 'auto',
              borderRadius: `${element.properties.borderRadius || 0}px`,
            }}
          />
        ) : (
          <div className="flex aspect-video w-full max-w-sm flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-900/60">
            <ImageIcon className="size-7" />
            <p className="mt-2 text-xs font-medium">
              Drop image here
            </p>
            <p className="mt-1 text-[11px]">
              or choose one in Properties
            </p>
          </div>
        )}
      </div>
    );
  }

  if (element.type === 'calendar') {
    return (
      <div
        id={element.properties.htmlId || undefined}
        className={element.properties.cssClass || undefined}
        style={{
          ...style,
          display: 'flex',
          justifyContent: getFlexAlignment(element.properties.contentAlign),
        }}
      >
        <Calendar
          mode="single"
          className="scale-90 rounded-lg border border-gray-200 shadow-sm dark:border-gray-700"
        />
      </div>
    );
  }

  if (element.type === 'flex' || element.type === 'grid') {
    return (
      <ContainerElementContent
        element={element}
        selectedElement={selectedElement}
        hoveredElement={hoveredElement}
        onSelectElement={onSelectElement}
        onUpdate={onUpdate}
        onMoveElementToColumn={onMoveElementToColumn}
      />
    );
  }

  return null;
}
