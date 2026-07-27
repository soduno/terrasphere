import { useEditorCanvasInteractions } from '../../composables/editor/useEditorCanvasInteractions';
import type { EditorCanvasProps } from '../../types/editor';
import { EditorCanvasContent } from './EditorCanvasContent';
import { EditorCanvasFeedback } from './EditorCanvasFeedback';
import { useGridColumnSelection } from './GridColumnSelection';

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
  const gridColumnSelection = useGridColumnSelection();
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
  const selectElement = (elementId: string | null) => {
    gridColumnSelection.clearSelection();
    setSelectedElement(elementId);
  };

  return (
    <div
      ref={(node) => {
        interactions.drop(node);
      }}
      onClick={() => selectElement(null)}
      onMouseOver={interactions.handleMouseOver}
      onMouseLeave={() => interactions.setHoveredElement(null)}
      onDragEnter={interactions.handleDragEnter}
      onDragOver={interactions.handleDragOver}
      onDragLeave={interactions.handleDragLeave}
      onDrop={interactions.handleDrop}
      onDragStart={(event) => {
        const target = event.target;
        if (
          target instanceof HTMLImageElement
          && target.closest('[data-editor-element-id]')
        ) {
          event.preventDefault();
        }
      }}
      className={`relative flex-1 overflow-auto bg-white p-12 transition-all ${canvasStateClass}`}
    >
      <EditorCanvasFeedback
        isFileDragging={interactions.isFileDragging}
        isUploadingImages={isUploadingImages}
        imageUploadError={imageUploadError}
        showError={interactions.showError}
        justDropped={interactions.justDropped}
      />
      {interactions.fileDropIndicator && (
        interactions.fileDropIndicator.replaceImage ? (
          <div
            className="pointer-events-none absolute z-[90] rounded-xl border-2 border-dashed border-indigo-500 bg-indigo-500/10"
            style={{
              left: interactions.fileDropIndicator.left,
              top: interactions.fileDropIndicator.top,
              width: interactions.fileDropIndicator.width,
              height: interactions.fileDropIndicator.height,
            }}
          />
        ) : (
          <div
            className="pointer-events-none absolute z-[90] h-0.5 bg-indigo-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
            style={{
              left: interactions.fileDropIndicator.left,
              top: interactions.fileDropIndicator.top,
              width: interactions.fileDropIndicator.width,
            }}
          >
            <span className="absolute -left-1 -top-[3px] size-2 rounded-full border-2 border-indigo-500 bg-white" />
            <span className="absolute -right-1 -top-[3px] size-2 rounded-full border-2 border-indigo-500 bg-white" />
          </div>
        )
      )}
      <EditorCanvasContent
        elements={elements}
        selectedElement={selectedElement}
        hoveredElement={interactions.hoveredElement}
        isOver={interactions.isOver}
        showError={interactions.showError}
        hasContainerElements={hasContainerElements}
        setSelectedElement={selectElement}
        updateElement={updateElement}
        deleteElement={deleteElement}
        duplicateElement={duplicateElement}
        moveElement={moveElement}
        moveElementToColumn={moveElementToColumn}
      />
    </div>
  );
}
