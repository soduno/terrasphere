import { useEditorCanvasInteractions } from '../../composables/editor/useEditorCanvasInteractions';
import type { EditorCanvasProps } from '../../types/editor';
import { EditorCanvasContent } from './EditorCanvasContent';
import { EditorCanvasFeedback } from './EditorCanvasFeedback';

export function EditorCanvas({
  elements,
  selectedElement,
  setSelectedElement,
  updateElement,
  deleteElement,
  duplicateElement,
  moveElement,
  moveElementToColumn,
  addElement,
  hasContainerElements,
  onDropImageFiles = async () => undefined,
  isUploadingImages = false,
  imageUploadError = null,
}: EditorCanvasProps) {
  const interactions = useEditorCanvasInteractions({
    addElement,
    onDropImageFiles,
  });
  const canvasStateClass = interactions.showError
    ? 'bg-red-500/5'
    : interactions.isOver && interactions.canDrop
      ? 'bg-indigo-500/5'
      : interactions.justDropped
        ? 'bg-green-500/5'
        : '';

  return (
    <div
      ref={(node) => {
        interactions.drop(node);
      }}
      onClick={() => setSelectedElement(null)}
      onMouseOver={interactions.handleMouseOver}
      onMouseLeave={() => interactions.setHoveredElement(null)}
      onDragEnter={interactions.handleDragEnter}
      onDragOver={interactions.handleDragOver}
      onDragLeave={interactions.handleDragLeave}
      onDrop={interactions.handleDrop}
      className={`relative flex-1 overflow-auto bg-white p-12 transition-all ${canvasStateClass}`}
    >
      <EditorCanvasFeedback
        isFileDragging={interactions.isFileDragging}
        isUploadingImages={isUploadingImages}
        imageUploadError={imageUploadError}
        showError={interactions.showError}
        justDropped={interactions.justDropped}
      />
      <EditorCanvasContent
        elements={elements}
        selectedElement={selectedElement}
        hoveredElement={interactions.hoveredElement}
        isOver={interactions.isOver}
        showError={interactions.showError}
        hasContainerElements={hasContainerElements}
        setSelectedElement={setSelectedElement}
        updateElement={updateElement}
        deleteElement={deleteElement}
        duplicateElement={duplicateElement}
        moveElement={moveElement}
        moveElementToColumn={moveElementToColumn}
      />
    </div>
  );
}
