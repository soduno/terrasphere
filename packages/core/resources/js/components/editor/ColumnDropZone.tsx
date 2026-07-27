import { Plus } from 'lucide-react';
import { useColumnDropZone } from '../../composables/editor/useColumnDropZone';
import type { ColumnDropZoneProps } from '../../types/editor';
import { ColumnElement } from './ColumnElement';
import { getVerticalAlignment } from './editorElementStyles';
import { useGridColumnSelection } from './GridColumnSelection';

export function ColumnDropZone({
  columnIndex,
  parentId,
  elements,
  selectedElement,
  hoveredElement,
  onSelectElement,
  onUpdate,
  onAddToColumn,
  onDuplicateFromColumn,
  onMoveElement,
  onMoveElementToColumn,
  onDeleteFromColumn,
  elementGap,
  matchRowHeight = false,
  columnProperties,
}: ColumnDropZoneProps) {
  const gridColumnSelection = useGridColumnSelection();
  const isSelectedGridColumn =
    matchRowHeight
    && gridColumnSelection.selection?.containerId === parentId
    && gridColumnSelection.selection.columnIndex === columnIndex;
  const padding = columnProperties?.padding ?? '12';
  const margin = columnProperties?.margin ?? '0';
  const paddingTop = columnProperties?.paddingTop ?? padding;
  const paddingRight = columnProperties?.paddingRight ?? padding;
  const paddingBottom = columnProperties?.paddingBottom ?? padding;
  const paddingLeft = columnProperties?.paddingLeft ?? padding;
  const marginTop = columnProperties?.marginTop ?? margin;
  const marginRight = columnProperties?.marginRight ?? margin;
  const marginBottom = columnProperties?.marginBottom ?? margin;
  const marginLeft = columnProperties?.marginLeft ?? margin;
  const dropZone = useColumnDropZone({
    parentId,
    elementCount: elements.length,
    emptyIndicatorTop: Number.parseFloat(paddingTop) || 0,
    onAddToColumn,
    onMoveElement,
  });
  const stateClass = dropZone.isOver
    ? 'ring-indigo-400/80 bg-indigo-50/70 dark:bg-indigo-500/10 shadow-[0_0_0_3px_rgba(99,102,241,0.08)]'
    : dropZone.justDropped
      ? 'ring-emerald-400/80 bg-emerald-50/70 dark:bg-emerald-500/10 shadow-[0_0_0_3px_rgba(16,185,129,0.08)]'
      : isSelectedGridColumn
        ? 'ring-indigo-500 bg-indigo-50/45 shadow-[0_0_0_2px_rgba(99,102,241,0.12)] dark:bg-indigo-500/10 dark:ring-indigo-400'
        : 'ring-slate-200/80 dark:ring-white/10 bg-slate-50/20 dark:bg-white/[0.015]';
  const sizingClass = elements.length === 0
    ? `min-h-[150px] ${matchRowHeight ? 'self-stretch' : ''}`
    : `min-h-0 ${matchRowHeight ? 'self-stretch' : 'self-start'}`;

  return (
    <div
      ref={(node) => {
        dropZone.drop(node);
      }}
      onClick={(event) => {
        if (!matchRowHeight) return;
        event.stopPropagation();
        onSelectElement(parentId);
        gridColumnSelection.selectColumn(parentId, columnIndex);
      }}
      className={`relative flex min-w-0 flex-1 flex-col rounded-lg ring-1 ring-inset transition-all duration-200 hover:bg-indigo-50/25 hover:ring-indigo-300/70 dark:hover:bg-indigo-500/5 dark:hover:ring-indigo-500/30 ${matchRowHeight ? 'w-auto' : 'w-full'} ${sizingClass} ${stateClass} ${
        dropZone.justDropped ? 'animate-in zoom-in-95 duration-300' : ''
      }`}
      style={{
        justifyContent:
          matchRowHeight && elements.length > 0
            ? getVerticalAlignment(columnProperties?.verticalAlign ?? 'top')
            : undefined,
        paddingTop: `${paddingTop}px`,
        paddingRight: `${paddingRight}px`,
        paddingBottom: `${paddingBottom}px`,
        paddingLeft: `${paddingLeft}px`,
        marginTop: matchRowHeight ? `${marginTop}px` : undefined,
        marginRight: matchRowHeight ? `${marginRight}px` : undefined,
        marginBottom: matchRowHeight ? `${marginBottom}px` : undefined,
        marginLeft: matchRowHeight ? `${marginLeft}px` : undefined,
      }}
    >
      {elements.length === 0 ? (
        <EmptyColumn isOver={dropZone.isOver} />
      ) : (
        <div
          className="flex flex-col"
          data-editor-column-items
        >
          {elements.map((element, index) => (
            <ColumnElement
              key={element.id}
              element={element}
              index={index}
              parentId={parentId}
              columnIndex={columnIndex}
              elementGap={elementGap ?? '8'}
              isLast={index === elements.length - 1}
              isSelected={selectedElement === element.id}
              isHovered={hoveredElement === element.id}
              selectedElement={selectedElement}
              hoveredElement={hoveredElement}
              showToolbar={
                hoveredElement === element.id
                || (selectedElement === element.id && hoveredElement === null)
              }
              onSelect={() => onSelectElement(element.id)}
              onSelectElement={onSelectElement}
              onUpdate={onUpdate}
              onMove={onMoveElement}
              onMoveElementToColumn={onMoveElementToColumn}
              onInsertNew={onAddToColumn}
              onDuplicate={() => onDuplicateFromColumn(element.id)}
              onDelete={() => onDeleteFromColumn(element.id)}
            />
          ))}
        </div>
      )}
      {dropZone.isOver && dropZone.canDrop && (
        <div
          className="pointer-events-none absolute z-30 h-2 -translate-y-1/2"
          style={{
            top: dropZone.indicatorTop,
            left: `${paddingLeft}px`,
            right: `${paddingRight}px`,
          }}
        >
          <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-indigo-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]">
            <span className="absolute -left-1 -top-[3px] size-2 rounded-full border-2 border-indigo-500 bg-white" />
            <span className="absolute -right-1 -top-[3px] size-2 rounded-full border-2 border-indigo-500 bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyColumn({ isOver }: { isOver: boolean }) {
  return (
    <div className="pointer-events-none flex min-h-[124px] w-full flex-col items-center justify-center text-center">
      <div className={`mb-2 flex size-10 items-center justify-center rounded-lg transition-all ${
        isOver
          ? 'scale-110 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20'
          : 'bg-transparent'
      }`}>
        <Plus className={`size-5 ${
          isOver ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'
        }`} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {isOver ? 'Drop element here' : 'Drag elements here'}
      </p>
    </div>
  );
}
