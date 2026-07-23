import { useLayoutEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { EditorElement } from './ElementTypes';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Calendar } from '../ui/calendar';

interface ColumnElementProps {
  element: EditorElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<EditorElement>) => void;
  onDelete: () => void;
}

export function ColumnElement({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: ColumnElementProps) {
  const editableRef = useRef<HTMLDivElement>(null);
  const draftContentRef = useRef<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (element.type === 'text' || element.type === 'heading' || element.type === 'wysiwyg') {
      e.stopPropagation();
      draftContentRef.current = e.currentTarget.innerHTML;
      setIsEditing(true);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    draftContentRef.current = e.currentTarget.innerHTML;
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const content = draftContentRef.current ?? e.currentTarget.innerHTML;
    draftContentRef.current = null;
    onUpdate(element.id, { content });
    setIsEditing(false);
  };

  useLayoutEffect(() => {
    if (!isEditing && editableRef.current) {
      const defaultContent =
        element.type === 'heading'
          ? 'Heading Text'
          : element.type === 'wysiwyg'
            ? '<p>Start writing...</p>'
            : 'Click to edit...';
      const content = element.content || defaultContent;

      if (editableRef.current.innerHTML !== content) {
        editableRef.current.innerHTML = content;
      }
    }
  }, [element.content, element.type, isEditing]);

  const renderElement = () => {
    const style = {
      padding: `${element.properties.padding || 10}px`,
      margin: `${element.properties.margin || 0}px 0`,
      backgroundColor: element.properties.backgroundColor || 'transparent',
      textAlign: element.properties.textAlign || 'left',
      fontSize: `${element.properties.fontSize || 14}px`,
      color: element.properties.color || '#000000',
      borderRadius: `${element.properties.borderRadius || 0}px`,
    } as React.CSSProperties;

    switch (element.type) {
      case 'heading':
        return (
          <div
            ref={editableRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onDoubleClick={handleDoubleClick}
            onInput={handleInput}
            onBlur={handleBlur}
            style={style}
            className={`outline-none transition-all ${
              isEditing ? 'ring-2 ring-indigo-500 rounded-lg' : ''
            } ${!isEditing ? 'cursor-text' : ''}`}
          />
        );

      case 'text':
        return (
          <div
            ref={editableRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onDoubleClick={handleDoubleClick}
            onInput={handleInput}
            onBlur={handleBlur}
            style={style}
            className={`outline-none transition-all ${
              isEditing ? 'ring-2 ring-indigo-500 rounded-lg' : ''
            } ${!isEditing ? 'cursor-text' : ''}`}
          />
        );

      case 'wysiwyg':
        return (
          <div
            ref={editableRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onDoubleClick={handleDoubleClick}
            onInput={handleInput}
            onBlur={handleBlur}
            style={style}
            className={`outline-none transition-all min-h-[60px] ${
              isEditing ? 'ring-2 ring-indigo-500 rounded-lg' : ''
            } ${!isEditing ? 'cursor-text' : ''}`}
          />
        );

      case 'image':
        return (
          <div style={{ padding: `${element.properties.padding || 10}px 0` }}>
            <ImageWithFallback
              src={element.properties.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'}
              alt="Content"
              className="w-full h-auto rounded-lg object-cover"
              style={{ borderRadius: `${element.properties.borderRadius || 0}px` }}
            />
          </div>
        );

      case 'calendar':
        return (
          <div style={style} className="flex justify-center">
            <Calendar
              mode="single"
              className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm scale-90"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="relative group"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Delete Button */}
      {isHovered && !isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg z-10 transition-all hover:scale-110"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}

      {/* Hover Border */}
      {(isHovered || isSelected) && !isEditing && (
        <div className="absolute -inset-0.5 border border-indigo-400 dark:border-indigo-500 rounded-lg pointer-events-none animate-in fade-in duration-150" />
      )}

      {/* Element Content */}
      <div className={`${isEditing ? 'relative z-20' : ''} rounded-lg`}>
        {renderElement()}
      </div>

      {/* Edit Hint */}
      {(element.type === 'text' || element.type === 'heading' || element.type === 'wysiwyg') && 
       isHovered && 
       !isEditing && (
        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-gray-900/70 text-white text-[10px] rounded z-10">
          Double-click
        </div>
      )}
    </div>
  );
}
