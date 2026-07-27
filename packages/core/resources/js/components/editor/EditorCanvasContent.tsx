import { motion } from 'motion/react';
import type { EditorCanvasContentProps } from '../../types/editor';
import { DraggableElement } from './DraggableElement';

function EmptyCanvas({
  isOver,
  showError,
}: Pick<EditorCanvasContentProps, 'isOver' | 'showError'>) {
  if (showError) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center py-32 text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-red-500 shadow-lg shadow-red-500/30">
          <svg
            className="size-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-xl text-gray-900">Cannot Drop Here</h3>
        <p className="max-w-md text-gray-500">
          Content elements must be placed inside Flex or Grid containers
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center py-32 text-center">
      <div
        className={`mb-6 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 transition-transform ${
          isOver ? 'scale-110' : 'scale-100'
        }`}
      >
        <svg
          className="size-10 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-xl text-gray-900">
        {isOver ? 'Drop to Add Element' : 'Start Building'}
      </h3>
      <p className="max-w-md text-gray-500">
        {isOver
          ? 'Release to add this element to your page'
          : 'Drag layout containers from the sidebar to create your page. Click text to edit.'}
      </p>
    </div>
  );
}

export function EditorCanvasContent({
  elements,
  selectedElement,
  hoveredElement,
  isOver,
  showError,
  hasContainerElements,
  setSelectedElement,
  updateElement,
  deleteElement,
  duplicateElement,
  moveElement,
  moveElementToColumn,
}: EditorCanvasContentProps) {
  if (elements.length === 0) {
    return <EmptyCanvas isOver={isOver} showError={showError} />;
  }

  return (
    <div className="flow-root space-y-1">
      {elements.map((element, index) => {
        const isContainer =
          element.type === 'flex' || element.type === 'grid';
        const isDisabled = hasContainerElements && !isContainer;

        return (
          <motion.div
            key={element.id}
            layout="position"
            transition={{
              layout: {
                type: 'spring',
                stiffness: 500,
                damping: 38,
                mass: 0.55,
              },
            }}
            className={`transition-all duration-300 ${
              isDisabled ? 'pointer-events-none opacity-50 blur-sm' : ''
            }`}
          >
            <DraggableElement
              element={element}
              index={index}
              isSelected={selectedElement === element.id}
              hoveredElement={hoveredElement}
              onSelect={() => setSelectedElement(element.id)}
              selectedElement={selectedElement}
              onSelectElement={(id) => setSelectedElement(id)}
              onUpdate={updateElement}
              onDelete={deleteElement}
              onDuplicate={duplicateElement}
              onMove={moveElement}
              onMoveElementToColumn={moveElementToColumn}
            />
          </motion.div>
        );
      })}

      {!hasContainerElements && (
        <div className="flex items-center justify-center py-8">
          <div className="max-w-md rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-center">
            <p className="text-sm text-yellow-800">
              <strong>Tip:</strong> Add a Flex or Grid container first to
              organize your layout
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
