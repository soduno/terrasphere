import { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { EditorElement, DEFAULT_PROPERTIES } from './ElementTypes';
import { ColumnElement } from './ColumnElement';
import { Plus } from 'lucide-react';

interface ColumnDropZoneProps {
  columnIndex: number;
  parentId: string;
  elements: EditorElement[];
  onUpdate: (id: string, updates: Partial<EditorElement>) => void;
  onAddToColumn: (element: EditorElement) => void;
  onDeleteFromColumn: (childId: string) => void;
}

export function ColumnDropZone({
  columnIndex,
  parentId,
  elements,
  onUpdate,
  onAddToColumn,
  onDeleteFromColumn,
}: ColumnDropZoneProps) {
  const [justDropped, setJustDropped] = useState(false);
  
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'new-element',
    drop: (item: { createElement: (columnCount?: number) => EditorElement; isLayout?: boolean }, monitor) => {
      // Only handle the drop if it's directly over this component (not a nested one)
      if (monitor.isOver({ shallow: true })) {
        const newElement = item.createElement();
        newElement.id = `col-element-${Date.now()}-${Math.random()}`;
        onAddToColumn(newElement);
        
        // Trigger drop animation
        setJustDropped(true);
        setTimeout(() => setJustDropped(false), 600);
        
        return { handled: true }; // Signal that we handled this drop
      }
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
      className={`min-h-[150px] p-3 border-2 border-dashed rounded-xl transition-all ${
        isOver
          ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 scale-[1.02]'
          : justDropped
          ? 'border-green-500 bg-green-500/10 dark:bg-green-500/10'
          : 'border-gray-300 dark:border-gray-600 bg-transparent'
      } hover:border-indigo-400 dark:hover:border-indigo-500 ${
        justDropped ? 'animate-in zoom-in-95 duration-300' : ''
      }`}
    >
      {elements.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full py-8 text-center">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2 transition-all ${
            isOver 
              ? 'from-indigo-500 to-purple-600 scale-110' 
              : 'from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700'
          }`}>
            <Plus className="w-5 h-5 text-white" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isOver ? 'Drop element here' : 'Drag elements here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {elements.map((element) => (
            <ColumnElement
              key={element.id}
              element={element}
              onUpdate={onUpdate}
              onDelete={() => onDeleteFromColumn(element.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}