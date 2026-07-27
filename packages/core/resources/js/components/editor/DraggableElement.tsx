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
    handleClick,
    handleInput,
    handleBlur,
  } = useInlineElementEditing({ element, onUpdate });
  const {
    elementRef,
    drag,
    dropTargetRef,
    dropPosition,
    isDragging,
    isOverTarget,
  } = useElementReordering({
    elementId: element.id,
    index,
    onMove,
  });

  return (
    <motion.div
      ref={(node) => {
        elementRef.current = node;
        dropTargetRef(node);
      }}
      data-editor-element-id={element.id}
      data-editor-element-type={element.type}
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
        className={`${isEditing ? 'relative z-30' : ''} flex flex-col`}
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
          onClick={handleClick}
          onInput={handleInput}
          onBlur={handleBlur}
          onSelectElement={onSelectElement}
          onUpdate={onUpdate}
          onMoveElementToColumn={onMoveElementToColumn}
        />
      </div>
    </motion.div>
  );
}
