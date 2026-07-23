import { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { EditorElement, DEFAULT_PROPERTIES } from './ElementTypes';
import { ColumnElement } from './ColumnElement';
import { Plus } from 'lucide-react';

interface ColumnDropZoneProps {
  columnIndex: number;
  parentId: string;
  elements: EditorElement[];
  selectedElement: string | null;
  onSelectElement: (id: string) => void;
  onUpdate: (id: string, updates: Partial<EditorElement>) => void;
  onAddToColumn: (element: EditorElement) => void;
  onDeleteFromColumn: (childId: string) => void;
  elementGap?: string;
}

export function ColumnDropZone({
  columnIndex,
  parentId,
  elements,
  selectedElement,
  onSelectElement,
  onUpdate,
  onAddToColumn,
  onDeleteFromColumn,
  elementGap,
}: ColumnDropZoneProps) {
  const [justDropped, setJustDropped] = useState(false);
  
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'new-element',
    drop: (item: { createElement: (columnCount?: number) => EditorElement; isLayout?: boolean }) => {
      const newElement = item.createElement();
      newElement.id = `col-element-${Date.now()}-${Math.random()}`;
      onAddToColumn(newElement);

      // Trigger drop animation
      setJustDropped(true);
      setTimeout(() => setJustDropped(false), 600);

      return { handled: true }; // Signal that we handled this drop
    },
    canDrop: (item: { isLayout?: boolean }) => {
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
      ref={drop}
      className={`w-full min-w-0 flex-1 min-h-[150px] p-3 border rounded-md shadow-sm transition-all duration-200 ${
        isOver
          ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-500/10 ring-2 ring-indigo-500/15'
          : justDropped
          ? 'border-green-500 bg-green-50/80 dark:bg-green-500/10 ring-2 ring-green-500/15'
          : 'border-indigo-200/80 dark:border-indigo-800/80 bg-transparent'
      } hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:border-indigo-600 dark:hover:bg-indigo-500/5 ${
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
        <div
          className="flex flex-col"
          style={{ gap: `${elementGap ?? '8'}px` }}
        >
          {elements.map((element) => (
            <ColumnElement
              key={element.id}
              element={element}
              isSelected={selectedElement === element.id}
              onSelect={() => onSelectElement(element.id)}
              onUpdate={onUpdate}
              onDelete={() => onDeleteFromColumn(element.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
