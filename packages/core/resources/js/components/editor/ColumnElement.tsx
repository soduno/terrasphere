import { useRef } from 'react';
import { motion } from 'motion/react';
import {
  initializeEmbeddedImages,
  useEmbeddedImageEditing,
} from '../../composables/editor/useEmbeddedImageEditing';
import { useColumnElementDragDrop } from '../../composables/editor/useColumnElementDragDrop';
import { useInlineElementEditing } from '../../composables/editor/useInlineElementEditing';
import type {
  ColumnElementProps,
  DropPosition,
} from '../../types/editor';
import { ColumnElementContent } from './ColumnElementContent';
import { ElementToolbar } from './ElementToolbar';
import { EmbeddedImageControls } from './EmbeddedImageControls';
import { getVerticalAlignment } from './editorElementStyles';

type DropLineProps = {
  color: 'indigo' | 'sky';
  position?: DropPosition;
  top?: number;
  zIndex?: string;
};

function DropLine({
  color,
  position,
  top,
  zIndex = 'z-30',
}: DropLineProps) {
  const lineClass = color === 'sky' ? 'bg-sky-500' : 'bg-indigo-500';
  const borderClass =
    color === 'sky' ? 'border-sky-500' : 'border-indigo-500';
  const positionClass =
    position === 'before'
      ? '-top-px'
      : position === 'after'
        ? '-bottom-px'
        : '';

  return (
    <div
      className={`pointer-events-none absolute left-0 right-0 h-0.5 shadow-[0_0_0_1px_rgba(255,255,255,0.9)] ${zIndex} ${lineClass} ${positionClass}`}
      style={top === undefined ? undefined : { top }}
    >
      <span className={`absolute -left-1 -top-[3px] size-2 rounded-full border-2 bg-white ${borderClass}`} />
      <span className={`absolute -right-1 -top-[3px] size-2 rounded-full border-2 bg-white ${borderClass}`} />
    </div>
  );
}

export function ColumnElement({
  element,
  index,
  parentId,
  columnIndex,
  elementGap,
  isLast,
  isSelected,
  isHovered,
  selectedElement,
  hoveredElement,
  showToolbar,
  onSelect,
  onSelectElement,
  onUpdate,
  onMove,
  onMoveElementToColumn,
  onInsertNew,
  onDuplicate,
  onDelete,
}: ColumnElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const editing = useInlineElementEditing({
    element,
    onUpdate,
    onContentRendered: initializeEmbeddedImages,
  });
  const embeddedImages = useEmbeddedImageEditing({
    elementRef,
    editableRef: editing.editableRef,
    saveContent: editing.saveCurrentContent,
    onSelect,
  });
  const dragState = useColumnElementDragDrop({
    element,
    index,
    parentId,
    columnIndex,
    elementRef,
    editableRef: editing.editableRef,
    embeddedImageId: embeddedImages.image?.id,
    setDraftContent: editing.setDraftContent,
    onUpdate,
    onSelect,
    onMove,
    onInsertNew,
    positionEmbeddedImage: embeddedImages.positionImage,
  });
  const floatDirection = element.properties.float || 'none';

  return (
    <motion.div
      ref={(node) => {
        elementRef.current = node;
        dragState.dropTargetRef(node);
      }}
      layout="position"
      layoutId={`editor-element-${element.id}`}
      animate={{
        opacity: dragState.isDragging ? 0.4 : 1,
        scale: dragState.isDragging ? 0.985 : 1,
      }}
      transition={{
        layout: {
          type: 'spring',
          stiffness: 500,
          damping: 38,
          mass: 0.55,
        },
        opacity: { duration: 0.16 },
        scale: { duration: 0.16, ease: 'easeOut' },
      }}
      className={`group relative ${embeddedImages.image ? 'z-30' : ''}`}
      data-editor-element-id={element.id}
      data-editor-element-type={element.type}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      style={{
        display: floatDirection === 'none' ? 'flex' : 'flow-root',
        flex: floatDirection === 'none' ? '0 0 auto' : undefined,
        flexDirection: floatDirection === 'none' ? 'column' : undefined,
        float: floatDirection === 'none' ? undefined : floatDirection,
        width:
          floatDirection === 'none'
            ? undefined
            : element.type === 'image'
              ? element.properties.imageWidth || '60%'
              : 'fit-content',
        maxWidth: '100%',
        marginBottom: isLast ? undefined : `${elementGap}px`,
      }}
    >
      {dragState.isOverImageTarget && dragState.imageDropPoint && (
        <DropLine
          color="indigo"
          top={dragState.imageDropPoint.localY}
        />
      )}
      {dragState.isOverEmbeddedTarget
        && dragState.embeddedDropY !== null && (
        <DropLine
          color="indigo"
          top={dragState.embeddedDropY}
          zIndex="z-40"
        />
      )}
      {dragState.isOverTarget && !dragState.isDragging && (
        <DropLine color="sky" position={dragState.dropPosition} />
      )}
      {dragState.isOverNewElementTarget && (
        <DropLine color="indigo" position={dragState.dropPosition} />
      )}

      {embeddedImages.image && isSelected && (
        <EmbeddedImageControls
          image={embeddedImages.image}
          showSettings={embeddedImages.showSettings}
          dragHandleRef={(node) => {
            dragState.embeddedDrag(node);
          }}
          onToggleSettings={embeddedImages.toggleSettings}
          onDuplicate={embeddedImages.duplicate}
          onDelete={embeddedImages.remove}
          onWidthChange={embeddedImages.changeWidth}
          onAlignmentChange={embeddedImages.changeAlignment}
          onFloatChange={embeddedImages.changeFloat}
        />
      )}

      {showToolbar && !editing.isEditing && (
        <ElementToolbar
          dragHandleRef={(node) => {
            dragState.drag(node);
          }}
          onSelect={onSelect}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      )}

      {(isHovered || isSelected) && !editing.isEditing && (
        <svg
          aria-hidden="true"
          className="animate-in fade-in pointer-events-none absolute -inset-0.5 h-[calc(100%+4px)] w-[calc(100%+4px)] overflow-visible text-indigo-500/80 duration-150"
        >
          <rect
            x="0.75"
            y="0.75"
            width="calc(100% - 1.5px)"
            height="calc(100% - 1.5px)"
            rx="1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      <div
        className={`${editing.isEditing ? 'relative z-20' : ''} flex flex-col rounded-lg`}
        style={{
          justifyContent: getVerticalAlignment(
            element.properties.verticalAlign,
          ),
        }}
      >
        <ColumnElementContent
          element={element}
          selectedElement={selectedElement}
          hoveredElement={hoveredElement}
          editableRef={editing.editableRef}
          isEditing={editing.isEditing}
          onClick={(event) => {
            const clickedEmbeddedImage = (
              event.target as Element
            ).closest('img[data-editor-embedded-image]');

            if (clickedEmbeddedImage) {
              embeddedImages.handleImageClick(event);
              return;
            }

            editing.handleClick(event);
          }}
          onInput={editing.handleInput}
          onBlur={editing.handleBlur}
          onSelectElement={onSelectElement}
          onUpdate={onUpdate}
          onMoveElementToColumn={onMoveElementToColumn}
        />
      </div>
    </motion.div>
  );
}
