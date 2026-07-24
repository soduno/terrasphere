import { useState } from 'react';
import { useDrop } from 'react-dnd';
import { EditorElement } from './ElementTypes';
import { ColumnElement } from './ColumnElement';
import { Plus } from 'lucide-react';

interface ColumnDropZoneProps {
  columnIndex: number;
  parentId: string;
  elements: EditorElement[];
  selectedElement: string | null;
  hoveredElement: string | null;
  onSelectElement: (id: string) => void;
  onUpdate: (id: string, updates: Partial<EditorElement>) => void;
  onAddToColumn: (element: EditorElement, insertionIndex?: number) => void;
  onDuplicateFromColumn: (childId: string) => void;
  onMoveInColumn: (dragIndex: number, hoverIndex: number) => void;
  onDeleteFromColumn: (childId: string) => void;
  elementGap?: string;
}

interface NewElementDropItem {
  createElement: (columnCount?: number) => EditorElement;
  isLayout?: boolean;
}

export function ColumnDropZone({
  columnIndex,
  parentId,
  elements,
  selectedElement,
  hoveredElement,
  onSelectElement,
  onUpdate,
  onAddToColumn,
  onDuplicateFromColumn,
  onMoveInColumn,
  onDeleteFromColumn,
  elementGap,
}: ColumnDropZoneProps) {
  const [justDropped, setJustDropped] = useState(false);
  
  const [{ isOver, canDrop }, drop] = useDrop<
    NewElementDropItem,
    { handled: true } | void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: 'new-element',
    drop: (item, monitor) => {
      if (monitor.didDrop()) {
        return { handled: true };
      }

      const newElement = item.createElement();
      newElement.id = `col-element-${Date.now()}-${Math.random()}`;
      onAddToColumn(newElement);

      // Trigger drop animation
      setJustDropped(true);
      setTimeout(() => setJustDropped(false), 600);

      return { handled: true }; // Signal that we handled this drop
    },
    canDrop: (item) => {
      // Don't allow layout elements inside containers
      return !item.isLayout;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={(node) => {
        drop(node);
      }}
      className={`relative flex w-full min-w-0 flex-1 min-h-[150px] flex-col p-3 rounded-lg ring-1 ring-inset transition-all duration-200 ${
        isOver
          ? 'ring-indigo-400/80 bg-indigo-50/70 dark:bg-indigo-500/10 shadow-[0_0_0_3px_rgba(99,102,241,0.08)]'
          : justDropped
          ? 'ring-emerald-400/80 bg-emerald-50/70 dark:bg-emerald-500/10 shadow-[0_0_0_3px_rgba(16,185,129,0.08)]'
          : 'ring-slate-200/80 dark:ring-white/10 bg-slate-50/20 dark:bg-white/[0.015]'
      } hover:ring-indigo-300/70 hover:bg-indigo-50/25 dark:hover:ring-indigo-500/30 dark:hover:bg-indigo-500/5 ${
        justDropped ? 'animate-in zoom-in-95 duration-300' : ''
      }`}
    >
      {elements.length === 0 ? (
        <div className="pointer-events-none flex w-full min-h-[124px] flex-col items-center justify-center text-center">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-all ${
            isOver 
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 scale-110 shadow-md shadow-indigo-500/20'
              : 'bg-transparent'
          }`}>
            <Plus className={`w-5 h-5 ${isOver ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isOver ? 'Drop element here' : 'Drag elements here'}
          </p>
        </div>
      ) : (
        <div className="flex min-h-[124px] flex-1 flex-col">
          {elements.map((element, index) => (
            <ColumnElement
              key={element.id}
              element={element}
              index={index}
              dragType={`column-element-${parentId}-${columnIndex}`}
              elementGap={elementGap ?? '8'}
              isLast={index === elements.length - 1}
              isSelected={selectedElement === element.id}
              isHovered={hoveredElement === element.id}
              showToolbar={
                hoveredElement === element.id
                || (selectedElement === element.id && hoveredElement === null)
              }
              onSelect={() => onSelectElement(element.id)}
              onUpdate={onUpdate}
              onMove={onMoveInColumn}
              onInsertNew={(newElement, insertionIndex) =>
                onAddToColumn(newElement, insertionIndex)
              }
              onDuplicate={() => onDuplicateFromColumn(element.id)}
              onDelete={() => onDeleteFromColumn(element.id)}
            />
          ))}
        </div>
      )}
      {isOver && canDrop && (
        <div className="pointer-events-none relative z-30 mt-2 h-2">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-indigo-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]">
            <span className="absolute -left-1 -top-[3px] size-2 rounded-full border-2 border-indigo-500 bg-white" />
            <span className="absolute -right-1 -top-[3px] size-2 rounded-full border-2 border-indigo-500 bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}
