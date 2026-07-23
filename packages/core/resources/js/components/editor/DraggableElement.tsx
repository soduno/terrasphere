import { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Trash2, GripVertical, Copy, Eye, EyeOff, Plus } from 'lucide-react';
import { EditorElement } from './ElementTypes';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Calendar } from '../ui/calendar';
import { ColumnDropZone } from './ColumnDropZone';

interface DraggableElementProps {
  element: EditorElement;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<EditorElement>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  parentId?: string;
  columnIndex?: number;
}

export function DraggableElement({
  element,
  index,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onMove,
  parentId,
  columnIndex,
}: DraggableElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'element',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'element',
    hover: (item: { index: number }) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  preview(drop(ref));

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    onUpdate(element.id, { content: e.currentTarget.innerHTML });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (element.type === 'text' || element.type === 'heading' || element.type === 'wysiwyg') {
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const getColumnCount = () => {
    if (element.type === 'flex' || element.type === 'grid') {
      return element.properties.columnCount || 1;
    }
    return 1;
  };

  const renderElement = () => {
    const style = {
      padding: `${element.properties.padding || 20}px`,
      margin: `${element.properties.margin || 10}px 0`,
      backgroundColor: element.properties.backgroundColor || 'transparent',
      textAlign: element.properties.textAlign || 'left',
      fontSize: `${element.properties.fontSize || 16}px`,
      color: element.properties.color || '#000000',
      borderRadius: `${element.properties.borderRadius || 0}px`,
    } as React.CSSProperties;

    switch (element.type) {
      case 'heading':
        return (
          <div
            contentEditable={isEditing}
            suppressContentEditableWarning
            onDoubleClick={handleDoubleClick}
            onBlur={handleBlur}
            onInput={handleContentChange}
            style={style}
            className={`outline-none transition-all ${
              isEditing ? 'ring-2 ring-indigo-500 rounded-lg' : ''
            } ${!isEditing ? 'cursor-text' : ''}`}
            dangerouslySetInnerHTML={{ __html: element.content || 'Heading Text' }}
          />
        );

      case 'text':
        return (
          <div
            contentEditable={isEditing}
            suppressContentEditableWarning
            onDoubleClick={handleDoubleClick}
            onBlur={handleBlur}
            onInput={handleContentChange}
            style={style}
            className={`outline-none transition-all ${
              isEditing ? 'ring-2 ring-indigo-500 rounded-lg' : ''
            } ${!isEditing ? 'cursor-text' : ''}`}
            dangerouslySetInnerHTML={{ __html: element.content || 'Click to edit...' }}
          />
        );

      case 'wysiwyg':
        return (
          <div
            contentEditable={isEditing}
            suppressContentEditableWarning
            onDoubleClick={handleDoubleClick}
            onBlur={handleBlur}
            onInput={handleContentChange}
            style={style}
            className={`outline-none transition-all min-h-[100px] ${
              isEditing ? 'ring-2 ring-indigo-500 rounded-lg' : ''
            } ${!isEditing ? 'cursor-text' : ''}`}
            dangerouslySetInnerHTML={{ __html: element.content || '<p>Start writing...</p>' }}
          />
        );

      case 'image':
        return (
          <div style={{ padding: `${element.properties.padding || 20}px 0` }}>
            <ImageWithFallback
              src={element.properties.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'}
              alt="Content"
              className="w-full h-auto rounded-xl object-cover"
              style={{ borderRadius: `${element.properties.borderRadius || 0}px` }}
            />
          </div>
        );

      case 'calendar':
        return (
          <div style={style} className="flex justify-center">
            <Calendar
              mode="single"
              className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
            />
          </div>
        );

      case 'flex':
      case 'grid':
        const columnCount = getColumnCount();
        return (
          <div
            style={{
              ...style,
              display: element.type === 'flex' ? 'flex' : 'grid',
              gridTemplateColumns: element.type === 'grid' ? `repeat(${columnCount}, 1fr)` : undefined,
              gap: `${element.properties.columnGap || 20}px`,
            }}
          >
            {Array(columnCount).fill(null).map((_, idx) => {
              const columnElements = element.children?.filter(
                (child) => child.columnIndex === idx
              ) || [];
              
              return (
                <ColumnDropZone
                  key={`column-${element.id}-${idx}`}
                  columnIndex={idx}
                  parentId={element.id}
                  elements={columnElements}
                  onUpdate={onUpdate}
                  onAddToColumn={(newElement) => {
                    const newChildren = [...(element.children || [])];
                    newChildren.push({ ...newElement, columnIndex: idx });
                    onUpdate(element.id, { children: newChildren });
                  }}
                  onDeleteFromColumn={(childId) => {
                    const newChildren = (element.children || []).filter(
                      (child) => child.id !== childId
                    );
                    onUpdate(element.id, { children: newChildren });
                  }}
                />
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={ref}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group transition-all ${isDragging ? 'opacity-40' : 'opacity-100'}`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      {/* Selection Border */}
      {isSelected && (
        <div className="absolute -inset-1 border-2 border-indigo-500 rounded-xl pointer-events-none z-10 shadow-lg shadow-indigo-500/20 animate-in fade-in duration-200" />
      )}

      {/* Hover Overlay */}
      {isHovered && !isEditing && (
        <div className="absolute inset-0 bg-indigo-500/5 rounded-xl pointer-events-none z-[5] animate-in fade-in duration-150" />
      )}

      {/* Drag Handle */}
      <div
        ref={drag}
        className={`absolute -left-10 top-1/2 -translate-y-1/2 transition-all duration-200 ${
          isHovered || isSelected ? 'opacity-100' : 'opacity-0'
        } cursor-move z-20`}
      >
        <div className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700">
          <GripVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
      </div>

      {/* Action Buttons */}
      {(isHovered || isSelected) && !isEditing && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-1 z-20 animate-in slide-in-from-top-2 duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(element.id);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(element.id);
            }}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      )}

      {/* Element Content */}
      <div className={isEditing ? 'relative z-30' : ''}>
        {renderElement()}
      </div>

      {/* Edit Hint */}
      {(element.type === 'text' || element.type === 'heading' || element.type === 'wysiwyg') && 
       isHovered && 
       !isEditing && 
       !isSelected && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-gray-900/80 text-white text-xs rounded-md z-20 animate-in fade-in duration-200">
          Double-click to edit
        </div>
      )}
    </div>
  );
}