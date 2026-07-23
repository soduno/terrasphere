import { EditorElement } from './ElementTypes';
import { DraggableElement } from './DraggableElement';
import { useDrop } from 'react-dnd';
import { useState } from 'react';

interface EditorCanvasProps {
  elements: EditorElement[];
  selectedElement: string | null;
  setSelectedElement: (id: string | null) => void;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  moveElement: (dragIndex: number, hoverIndex: number) => void;
  addElement: (element: EditorElement) => void;
  hasContainerElements: boolean;
}

export function EditorCanvas({
  elements,
  selectedElement,
  setSelectedElement,
  updateElement,
  deleteElement,
  duplicateElement,
  moveElement,
  addElement,
  hasContainerElements,
}: EditorCanvasProps) {
  const [justDropped, setJustDropped] = useState(false);
  
  const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
    accept: 'new-element',
    drop: (item: { createElement: () => EditorElement; isLayout?: boolean }, monitor) => {
      // Only add to main canvas if not already handled by a nested drop zone
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        // Only allow layout elements on the main canvas
        if (!item.isLayout) {
          return; // Prevent drop - non-layout elements must go inside containers
        }
        const newElement = item.createElement();
        addElement(newElement);
        
        // Trigger drop animation
        setJustDropped(true);
        setTimeout(() => setJustDropped(false), 600);
      }
    },
    canDrop: (item: { isLayout?: boolean }) => {
      // Only allow layout elements on the main canvas
      return !!item.isLayout;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem(),
    }),
  });

  const showError = isOver && !canDrop;

  return (
    <div 
      ref={drop}
      className={`flex-1 overflow-auto bg-white p-12 transition-all relative ${
        isOver && canDrop
          ? 'bg-indigo-500/5' 
          : showError
          ? 'bg-red-500/5'
          : justDropped
          ? 'bg-green-500/5'
          : ''
      }`}
    >
      {showError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-red-500 rounded-full p-8 shadow-2xl shadow-red-500/50 animate-pulse">
            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      )}
      
      {justDropped && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-green-500 rounded-full p-8 shadow-2xl shadow-green-500/50 animate-in zoom-in-95 fade-out duration-500">
            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
      
      {elements.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-full text-center py-32">
          {showError ? (
            <>
              <div className="w-20 h-20 bg-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/30">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl text-gray-900 mb-2">
                Cannot Drop Here
              </h3>
              <p className="text-gray-500 max-w-md">
                Content elements must be placed inside Flex or Grid containers
              </p>
            </>
          ) : (
            <>
              <div className={`w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30 transition-transform ${
                isOver ? 'scale-110' : 'scale-100'
              }`}>
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl text-gray-900 mb-2">
                {isOver ? 'Drop to Add Element' : 'Start Building'}
              </h3>
              <p className="text-gray-500 max-w-md">
                {isOver 
                  ? 'Release to add this element to your page' 
                  : 'Drag layout containers from the sidebar to create your page. Double-click text to edit.'}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {elements.map((element, index) => {
            const isContainer = element.type === 'flex' || element.type === 'grid';
            const shouldBlur = !hasContainerElements || isContainer;
            
            return (
              <div
                key={element.id}
                className={`transition-all duration-300 ${
                  !shouldBlur ? 'blur-sm opacity-50 pointer-events-none' : ''
                }`}
              >
                <DraggableElement
                  element={element}
                  index={index}
                  isSelected={selectedElement === element.id}
                  onSelect={() => setSelectedElement(element.id)}
                  onUpdate={updateElement}
                  onDelete={deleteElement}
                  onDuplicate={duplicateElement}
                  onMove={moveElement}
                />
              </div>
            );
          })}
          {!hasContainerElements && elements.length > 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 max-w-md text-center">
                <p className="text-sm text-yellow-800">
                  <strong>Tip:</strong> Add a Flex or Grid container first to organize your layout
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}