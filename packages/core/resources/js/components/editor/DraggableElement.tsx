import { motion } from 'motion/react';
import { useElementReordering } from '../../composables/editor/useElementReordering';
import { useInlineElementEditing } from '../../composables/editor/useInlineElementEditing';
import type { DraggableElementProps } from '../../types/editor';
import { EditorElementContent } from './EditorElementContent';
import { ElementToolbar } from './ElementToolbar';
import { getVerticalAlignment } from './editorElementStyles';

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
  onMoveElementToColumn,
}: DraggableElementProps) {
  const isHovered = hoveredElement === element.id;
  const {
    editableRef,
    isEditing,
    handleDoubleClick,
    handleInput,
    handleBlur,
  } = useInlineElementEditing({ element, onUpdate });
  const {
    elementRef,
    drag,
    dropPosition,
    isDragging,
    isOverTarget,
  } = useElementReordering({
    index,
    onMove,
  });

  return (
    <motion.div
      ref={elementRef}
      data-editor-element-id={element.id}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      animate={{
        opacity: isDragging ? 0.4 : 1,
        scale: isDragging ? 0.985 : 1,
      }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="relative group"
      style={{
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

      {(isHovered || isSelected) && !isEditing && (
        <div className="absolute inset-0 z-[5] pointer-events-none ring-1 ring-inset ring-indigo-500/80 animate-in fade-in duration-150" />
      )}

      {(isHovered || (isSelected && hoveredElement === null)) && !isEditing && (
        <ElementToolbar
          dragHandleRef={(node) => {
            drag(node);
          }}
          dragTitle="Drag element"
          onSelect={onSelect}
          onDuplicate={() => onDuplicate(element.id)}
          onDelete={() => onDelete(element.id)}
        />
      )}

      <div
        className={`${isEditing ? 'relative z-30' : ''} flex min-h-full flex-col`}
        style={{
          justifyContent: getVerticalAlignment(
            element.properties.verticalAlign,
          ),
        }}
      >
        <EditorElementContent
          element={element}
          selectedElement={selectedElement}
          hoveredElement={hoveredElement}
          editableRef={editableRef}
          isEditing={isEditing}
          onDoubleClick={handleDoubleClick}
          onInput={handleInput}
          onBlur={handleBlur}
          onSelectElement={onSelectElement}
          onUpdate={onUpdate}
          onMoveElementToColumn={onMoveElementToColumn}
        />
      </div>

      {(element.type === 'text' || element.type === 'heading' || element.type === 'wysiwyg') && 
       isHovered && 
       !isEditing && 
       !isSelected && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-gray-900/80 text-white text-xs rounded-md z-20 animate-in fade-in duration-200">
          Double-click to edit
        </div>
      )}
    </motion.div>
  );
}
