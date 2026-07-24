import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { EditorSidebar } from '../editor/EditorSidebar';
import { EditorCanvas } from '../editor/EditorCanvas';
import { EditorToolbar } from '../editor/EditorToolbar';
import { EditorProperties } from '../editor/EditorProperties';
import { EditorElement } from '../editor/ElementTypes';

export function Editor() {
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showGridModal, setShowGridModal] = useState(false);
  const [pendingGridElement, setPendingGridElement] = useState<EditorElement | null>(null);

  const hasContainerElements = elements.some(el => el.type === 'flex' || el.type === 'grid');

  const addElement = (element: EditorElement) => {
    setElements([...elements, element]);
  };

  const addGridElement = (columnCount: number) => {
    const gridElement: EditorElement = {
      id: `element-${Date.now()}`,
      type: 'grid',
      properties: { 
        padding: '0',
        margin: '0',
        backgroundColor: 'transparent',
        textAlign: 'left',
        fontSize: '16',
        color: '#000000',
        borderRadius: '0',
        columnGap: '20',
        columnCount,
      },
      children: [],
    };
    addElement(gridElement);
    setShowGridModal(false);
  };

  const updateElement = (id: string, updates: Partial<EditorElement>) => {
    const updateRecursive = (els: EditorElement[]): EditorElement[] => {
      return els.map((el) => {
        if (el.id === id) {
          return { ...el, ...updates };
        }
        if (el.children) {
          return { ...el, children: updateRecursive(el.children) };
        }
        return el;
      });
    };
    setElements(updateRecursive(elements));
  };

  const deleteElement = (id: string) => {
    const deleteRecursive = (els: EditorElement[]): EditorElement[] => {
      return els.filter((el) => {
        if (el.id === id) return false;
        if (el.children) {
          el.children = deleteRecursive(el.children);
        }
        return true;
      });
    };
    setElements(deleteRecursive(elements));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const moveElement = (dragIndex: number, insertionIndex: number) => {
    const newElements = [...elements];
    const [draggedElement] = newElements.splice(dragIndex, 1);
    if (!draggedElement) return;

    const adjustedIndex = dragIndex < insertionIndex ? insertionIndex - 1 : insertionIndex;
    newElements.splice(adjustedIndex, 0, draggedElement);
    setElements(newElements);
  };

  const duplicateElement = (id: string) => {
    const findAndDuplicate = (els: EditorElement[]): EditorElement[] | null => {
      for (let i = 0; i < els.length; i++) {
        if (els[i].id === id) {
          const clone = JSON.parse(JSON.stringify(els[i]));
          clone.id = `element-${Date.now()}`;
          const newEls = [...els];
          newEls.splice(i + 1, 0, clone);
          return newEls;
        }
      }
      return null;
    };
    
    const duplicated = findAndDuplicate(elements);
    if (duplicated) {
      setElements(duplicated);
    }
  };

  const findElement = (els: EditorElement[], id: string | null): EditorElement | undefined => {
    if (!id) return undefined;

    for (const element of els) {
      if (element.id === id) return element;
      const child = findElement(element.children || [], id);
      if (child) return child;
    }

    return undefined;
  };

  const selectedElementData = findElement(elements, selectedElement);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50/50 dark:bg-gray-950">
        <EditorToolbar
          title="Untitled Page"
          saveStatus="saved"
        />
        <div className="flex-1 flex overflow-hidden">
          <EditorSidebar onAddElement={addElement} showGridModal={() => setShowGridModal(true)} hasContainerElements={hasContainerElements} />
          <EditorCanvas
            elements={elements}
            selectedElement={selectedElement}
            setSelectedElement={setSelectedElement}
            updateElement={updateElement}
            deleteElement={deleteElement}
            duplicateElement={duplicateElement}
            moveElement={moveElement}
            addElement={addElement}
            hasContainerElements={hasContainerElements}
          />
          <EditorProperties
            element={selectedElementData}
            updateElement={updateElement}
          />
        </div>
      </div>

      {/* Grid Column Count Modal */}
      {showGridModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl text-gray-900 dark:text-white mb-2">Grid Container</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              How many columns would you like?
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[2, 3, 4, 5, 6].map((count) => (
                <button
                  key={count}
                  onClick={() => addGridElement(count)}
                  className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all hover:scale-105 active:scale-95"
                >
                  <div className="text-3xl text-gray-900 dark:text-white mb-1">{count}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">columns</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowGridModal(false)}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </DndProvider>
  );
}
