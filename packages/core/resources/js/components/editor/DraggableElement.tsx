import { useLayoutEffect, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Trash2, Copy, Move, Settings } from 'lucide-react';
import { EditorElement } from './ElementTypes';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Calendar } from '../ui/calendar';
import { ColumnDropZone } from './ColumnDropZone';

interface DraggableElementProps {
  element: EditorElement;
  index: number;
  isSelected: boolean;
  hoveredElement: string | null;
  onSelect: () => void;
  selectedElement: string | null;
  onSelectElement: (id: string) => void;
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
  hoveredElement,
  onSelect,
  selectedElement,
  onSelectElement,
  onUpdate,
  onDelete,
  onDuplicate,
  onMove,
}: DraggableElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const draftContentRef = useRef<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('before');
  const isHovered = hoveredElement === element.id;

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'element',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOverTarget }, drop] = useDrop({
    accept: 'element',
    hover: (item: { index: number; dropPosition?: 'before' | 'after' }, monitor) => {
      if (!ref.current) return;
      const pointer = monitor.getClientOffset();
      if (!pointer) return;

      const bounds = ref.current.getBoundingClientRect();
      const position = pointer.y < bounds.top + bounds.height / 2 ? 'before' : 'after';
      item.dropPosition = position;
      setDropPosition(position);
    },
    drop: (item: { index: number; dropPosition?: 'before' | 'after' }) => {
      if (item.index === index) return;
      const insertionIndex = (item.dropPosition ?? dropPosition) === 'after' ? index + 1 : index;
      onMove(item.index, insertionIndex);
    },
    collect: (monitor) => ({
      isOverTarget: monitor.isOver({ shallow: true }),
    }),
  });

  preview(drop(ref));

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

  const getColumnCount = () => {
    if (element.type === 'flex' || element.type === 'grid') {
      return element.properties.columnCount || 1;
    }
    return 1;
  };

  const renderElement = () => {
    const style = {
      paddingTop: `${element.properties.paddingTop ?? element.properties.padding ?? 0}px`,
      paddingRight: `${element.properties.paddingRight ?? element.properties.padding ?? 0}px`,
      paddingBottom: `${element.properties.paddingBottom ?? element.properties.padding ?? 0}px`,
      paddingLeft: `${element.properties.paddingLeft ?? element.properties.padding ?? 0}px`,
      marginTop: `${element.properties.marginTop ?? element.properties.margin ?? 0}px`,
      marginRight: `${element.properties.marginRight ?? element.properties.margin ?? 0}px`,
      marginBottom: `${element.properties.marginBottom ?? element.properties.margin ?? 0}px`,
      marginLeft: `${element.properties.marginLeft ?? element.properties.margin ?? 0}px`,
      backgroundColor: element.properties.backgroundColor || 'transparent',
      textAlign: element.properties.contentAlign || element.properties.textAlign || 'left',
      fontSize: `${element.properties.fontSize || 16}px`,
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
            className={`outline-none transition-all min-h-[100px] ${
              isEditing ? 'ring-2 ring-indigo-500 rounded-lg' : ''
            } ${!isEditing ? 'cursor-text' : ''}`}
          />
        );

      case 'image':
        return (
          <div
            style={{
              ...style,
              display: 'flex',
              justifyContent:
                (element.properties.contentAlign || element.properties.imageAlign) === 'center'
                  ? 'center'
                  : (element.properties.contentAlign || element.properties.imageAlign) === 'right'
                    ? 'flex-end'
                    : 'flex-start',
            }}
          >
            <ImageWithFallback
              src={element.properties.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'}
              alt="Content"
              className="max-w-full rounded-xl object-cover"
              style={{
                width: element.properties.imageWidth || '100%',
                height: element.properties.imageHeight || 'auto',
                borderRadius: `${element.properties.borderRadius || 0}px`,
              }}
            />
          </div>
        );

      case 'calendar':
        return (
          <div
            style={{
              ...style,
              display: 'flex',
              justifyContent:
                element.properties.contentAlign === 'left'
                  ? 'flex-start'
                  : element.properties.contentAlign === 'right'
                    ? 'flex-end'
                    : 'center',
            }}
          >
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
              width: element.properties.width,
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
                  selectedElement={selectedElement}
                  hoveredElement={hoveredElement}
                  onSelectElement={onSelectElement}
                  onUpdate={onUpdate}
                  elementGap={element.type === 'flex' ? element.properties.columnGap : undefined}
                  onAddToColumn={(newElement, insertionIndex) => {
                    const newChildren = [...(element.children || [])];
                    const childWithColumn = { ...newElement, columnIndex: idx };

                    if (insertionIndex === undefined) {
                      newChildren.push(childWithColumn);
                    } else {
                      const columnChildIndexes = newChildren.reduce<number[]>(
                        (indexes, child, childIndex) => {
                          if ((child.columnIndex ?? 0) === idx) indexes.push(childIndex);
                          return indexes;
                        },
                        []
                      );
                      const globalInsertionIndex =
                        columnChildIndexes[insertionIndex]
                        ?? (columnChildIndexes.length > 0
                          ? columnChildIndexes[columnChildIndexes.length - 1] + 1
                          : newChildren.length);
                      newChildren.splice(globalInsertionIndex, 0, childWithColumn);
                    }

                    onUpdate(element.id, { children: newChildren });
                  }}
                  onDuplicateFromColumn={(childId) => {
                    const newChildren = [...(element.children || [])];
                    const childIndex = newChildren.findIndex((child) => child.id === childId);
                    if (childIndex === -1) return;

                    const source = newChildren[childIndex];
                    const duplicate = {
                      ...source,
                      id: `col-element-${Date.now()}-${Math.random()}`,
                      properties: { ...source.properties },
                    };
                    newChildren.splice(childIndex + 1, 0, duplicate);
                    onUpdate(element.id, { children: newChildren });
                  }}
                  onMoveInColumn={(dragIndex, insertionIndex) => {
                    const newChildren = [...(element.children || [])];
                    const columnChildren = newChildren.filter(
                      (child) => (child.columnIndex ?? 0) === idx
                    );
                    const [movedChild] = columnChildren.splice(dragIndex, 1);
                    if (!movedChild) return;

                    const adjustedIndex =
                      dragIndex < insertionIndex ? insertionIndex - 1 : insertionIndex;
                    columnChildren.splice(adjustedIndex, 0, movedChild);
                    let columnChildIndex = 0;
                    const reorderedChildren = newChildren.map((child) =>
                      (child.columnIndex ?? 0) === idx
                        ? columnChildren[columnChildIndex++]
                        : child
                    );
                    onUpdate(element.id, { children: reorderedChildren });
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
      data-editor-element-id={element.id}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`relative group transition-all ${isDragging ? 'opacity-40' : 'opacity-100'}`}
      style={{
        opacity: isDragging ? 0.4 : 1,
        float:
          element.properties.float && element.properties.float !== 'none'
            ? element.properties.float
            : undefined,
        width:
          element.properties.float && element.properties.float !== 'none'
            ? element.properties.width || 'fit-content'
            : undefined,
        maxWidth: '100%',
      }}
    >
      {isOverTarget && !isDragging && (
        <div
          className={`pointer-events-none absolute left-0 right-0 z-30 h-0.5 bg-sky-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)] ${
            dropPosition === 'before' ? '-top-px' : '-bottom-px'
          }`}
        >
          <span className="absolute -left-1 -top-[3px] size-2 rounded-full border-2 border-sky-500 bg-white" />
          <span className="absolute -right-1 -top-[3px] size-2 rounded-full border-2 border-sky-500 bg-white" />
        </div>
      )}

      {/* Hover Overlay */}
      {(isHovered || isSelected) && !isEditing && (
        <div className="absolute inset-0 z-[5] pointer-events-none ring-1 ring-inset ring-indigo-500/80 animate-in fade-in duration-150" />
      )}

      {/* Action Buttons */}
      {(isHovered || (isSelected && hoveredElement === null)) && !isEditing && (
        <div className="absolute -top-6 left-1/2 z-20 flex h-6 -translate-x-1/2 items-center rounded-sm bg-indigo-600 px-1 text-white animate-in fade-in duration-150">
          <span
            ref={(node) => {
              drag(node);
            }}
            className="flex h-full cursor-move items-center px-1.5 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
            title="Drag element"
          >
            <Move className="size-3.5" />
          </span>
          <div className="h-3.5 w-px bg-white/25" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="flex h-full items-center px-1.5 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
            title="Settings"
          >
            <Settings className="size-3.5" />
          </button>
          <div className="h-3.5 w-px bg-white/25" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(element.id);
            }}
            className="flex h-full items-center px-1.5 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
            title="Duplicate"
          >
            <Copy className="size-3.5" />
          </button>
          <div className="h-3.5 w-px bg-white/25" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(element.id);
            }}
            className="flex h-full items-center px-1.5 text-white/85 transition-colors hover:bg-red-500/35 hover:text-white"
            title="Delete"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}

      {/* Element Content */}
      <div
        className={`${isEditing ? 'relative z-30' : ''} flex min-h-full flex-col`}
        style={{
          justifyContent:
            element.properties.verticalAlign === 'center'
              ? 'center'
              : element.properties.verticalAlign === 'bottom'
                ? 'flex-end'
                : 'flex-start',
        }}
      >
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
