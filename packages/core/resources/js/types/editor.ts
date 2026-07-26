import type {
  FocusEventHandler,
  FormEventHandler,
  MouseEventHandler,
  ReactNode,
  RefCallback,
  RefObject,
} from 'react';
import type { LucideIcon } from 'lucide-react';

export type ElementType =
  | 'heading'
  | 'text'
  | 'wysiwyg'
  | 'image'
  | 'calendar'
  | 'flex'
  | 'grid';

export type DropPosition = 'before' | 'after';
export type ElementAlignment = 'left' | 'center' | 'right';

export const PROPERTY_SECTION_IDS = [
  'spacing',
  'horizontal-alignment',
  'vertical-alignment',
  'layout',
  'typography',
  'appearance',
  'image',
  'float',
] as const;

export type PropertySectionId = typeof PROPERTY_SECTION_IDS[number];

export interface EditorElementProperties {
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingLinked?: boolean;
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginLinked?: boolean;
  backgroundColor?: string;
  float?: 'none' | 'left' | 'right';
  textAlign?: ElementAlignment;
  fontSize?: string;
  color?: string;
  borderRadius?: string;
  imageUrl?: string;
  imageWidth?: string;
  imageHeight?: string;
  imageAlign?: ElementAlignment;
  contentAlign?: ElementAlignment;
  verticalAlign?: 'top' | 'center' | 'bottom';
  width?: string;
  columnGap?: string;
  columnCount?: number;
}

export interface EditorElement {
  id: string;
  type: ElementType;
  content?: string;
  properties: EditorElementProperties;
  children?: EditorElement[];
  columnIndex?: number;
}

export interface ElementDragItem {
  index: number;
  dropPosition?: DropPosition;
}

export interface ColumnElementDragItem {
  elementId: string;
  sourceParentId: string;
  sourceColumnIndex: number;
  sourceIndex: number;
  dropPosition?: DropPosition;
}

export interface ColumnDropItem {
  elementId?: string;
  sourceParentId?: string;
  sourceColumnIndex?: number;
  sourceIndex?: number;
  dropPosition?: DropPosition;
  elementType?: ElementType;
  createElement?: () => EditorElement;
  embeddedImageId?: string;
  isLayout?: boolean;
}

export interface EmbeddedImageOverlay {
  id: string;
  left: number;
  top: number;
  width: number;
  viewportLeft: number;
  viewportTop: number;
  widthPercent: number;
  alignment: ElementAlignment;
  float: 'none' | 'left' | 'right';
}

export interface NewEditorElementDragItem {
  createElement: (columnCount?: number) => EditorElement;
  elementType?: ElementType;
  isLayout?: boolean;
}

export interface EditorCanvasProps {
  elements: EditorElement[];
  selectedElement: string | null;
  setSelectedElement: (id: string | null) => void;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  moveElement: (dragIndex: number, hoverIndex: number) => void;
  moveElementToColumn: (
    item: ColumnElementDragItem,
    targetParentId: string,
    targetColumnIndex: number,
    insertionIndex: number,
  ) => void;
  addElement: (element: EditorElement) => void;
  hasContainerElements: boolean;
  onDropImageFiles?: (
    files: File[],
    targetElementId: string | null,
  ) => Promise<void>;
  isUploadingImages?: boolean;
  imageUploadError?: string | null;
}

export interface EditorCanvasFeedbackProps {
  isFileDragging: boolean;
  isUploadingImages: boolean;
  imageUploadError: string | null;
  showError: boolean;
  justDropped: boolean;
}

export interface EditorCanvasContentProps {
  elements: EditorElement[];
  selectedElement: string | null;
  hoveredElement: string | null;
  isOver: boolean;
  showError: boolean;
  hasContainerElements: boolean;
  setSelectedElement: (id: string | null) => void;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  moveElement: (dragIndex: number, hoverIndex: number) => void;
  moveElementToColumn: (
    item: ColumnElementDragItem,
    targetParentId: string,
    targetColumnIndex: number,
    insertionIndex: number,
  ) => void;
}

export interface DraggableElementProps {
  element: EditorElement;
  index: number;
  isSelected: boolean;
  hoveredElement: string | null;
  onSelect: () => void;
  selectedElement: string | null;
  onSelectElement: (id: string) => void;
  onUpdate: (id: string, updates: Partial<EditorElement>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onMoveElementToColumn: (
    item: ColumnElementDragItem,
    targetParentId: string,
    targetColumnIndex: number,
    insertionIndex: number,
  ) => void;
}

export interface EditorElementContentProps {
  element: EditorElement;
  selectedElement: string | null;
  hoveredElement: string | null;
  editableRef: RefObject<HTMLDivElement | null>;
  isEditing: boolean;
  onDoubleClick: MouseEventHandler<HTMLDivElement>;
  onInput: FormEventHandler<HTMLDivElement>;
  onBlur: FocusEventHandler<HTMLDivElement>;
  onSelectElement: (id: string) => void;
  onUpdate: (id: string, updates: Partial<EditorElement>) => void;
  onMoveElementToColumn: (
    item: ColumnElementDragItem,
    targetParentId: string,
    targetColumnIndex: number,
    insertionIndex: number,
  ) => void;
}

export interface ColumnDropZoneProps {
  columnIndex: number;
  parentId: string;
  elements: EditorElement[];
  selectedElement: string | null;
  hoveredElement: string | null;
  onSelectElement: (id: string) => void;
  onUpdate: (id: string, updates: Partial<EditorElement>) => void;
  onAddToColumn: (element: EditorElement, insertionIndex?: number) => void;
  onDuplicateFromColumn: (childId: string) => void;
  onMoveElement: (
    item: ColumnElementDragItem,
    insertionIndex: number,
  ) => void;
  onDeleteFromColumn: (childId: string) => void;
  elementGap?: string;
}

export interface ColumnElementProps {
  element: EditorElement;
  index: number;
  parentId: string;
  columnIndex: number;
  elementGap: string;
  isLast: boolean;
  isSelected: boolean;
  isHovered: boolean;
  showToolbar: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<EditorElement>) => void;
  onMove: (item: ColumnElementDragItem, insertionIndex: number) => void;
  onInsertNew: (element: EditorElement, insertionIndex: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export interface ColumnElementContentProps {
  element: EditorElement;
  editableRef: RefObject<HTMLDivElement | null>;
  isEditing: boolean;
  onDoubleClick: MouseEventHandler<HTMLDivElement>;
  onInput: FormEventHandler<HTMLDivElement>;
  onBlur: FocusEventHandler<HTMLDivElement>;
  onEmbeddedImageClick: MouseEventHandler<HTMLDivElement>;
}

export interface EmbeddedImageControlsProps {
  image: EmbeddedImageOverlay;
  showSettings: boolean;
  dragHandleRef: RefCallback<HTMLElement>;
  onToggleSettings: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onWidthChange: (width: number) => void;
  onAlignmentChange: (alignment: ElementAlignment) => void;
  onFloatChange: (float: 'none' | 'left' | 'right') => void;
}

export interface ElementToolbarProps {
  dragHandleRef: RefCallback<HTMLElement>;
  dragTitle?: string;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export interface EditorPropertiesProps {
  element?: EditorElement;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  sectionOrder?: PropertySectionId[];
  onSectionOrderChange?: (order: PropertySectionId[]) => void;
}

export interface PropertySectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  sectionId: PropertySectionId;
  position: number;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onDrop: () => void;
}

export interface SpacingControlProps {
  kind: 'padding' | 'margin';
  properties: EditorElementProperties;
  defaultValue: number;
  onChange: (updates: Partial<EditorElementProperties>) => void;
}

export type EditorPropertyChange = <
  Key extends keyof EditorElementProperties,
>(
  property: Key,
  value: EditorElementProperties[Key],
) => void;

export interface EditorPropertySectionsProps {
  element: EditorElement;
  onPropertyChange: EditorPropertyChange;
  onPropertiesChange: (updates: Partial<EditorElementProperties>) => void;
  onChooseImage: () => void;
  sortableSectionProps: (
    sectionId: PropertySectionId,
  ) => Omit<PropertySectionProps, 'title' | 'children'>;
}

export interface PropertyRangeProps {
  id: string;
  label: string;
  value: number;
  displayValue?: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export interface PropertyColorProps {
  id: string;
  label: string;
  value: string;
  pickerValue?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export interface EditorSidebarProps {
  onAddElement: (element: EditorElement) => void;
  showGridModal: () => void;
  hasContainerElements: boolean;
}

export interface EditorSidebarElement {
  type: ElementType;
  icon: LucideIcon;
  label: string;
  accent: 'indigo' | 'purple' | 'pink';
}

export interface EditorSidebarGroup {
  title: string;
  elements: EditorSidebarElement[];
}

export interface EditorSidebarItemProps {
  element: EditorSidebarElement;
  onCreate: (type: ElementType, columnCount?: number) => EditorElement;
  onAddElement: (element: EditorElement) => void;
  showGridModal: () => void;
  shouldBlur: boolean;
  hasContainerElements: boolean;
}

export interface UseSidebarElementDragOptions {
  element: EditorSidebarElement;
  onCreate: (type: ElementType, columnCount?: number) => EditorElement;
  canDrag: boolean;
}

export interface EditorToolbarProps {
  pageId?: number;
  title: string;
  saveStatus: EditorSaveStatus;
}

export type EditorSaveStatus = 'saved' | 'saving' | 'error';

export interface UseEditorAutosaveOptions {
  pageId: number;
  elements: EditorElement[];
  initialElements: EditorElement[];
  initialLockVersion: number;
  delay?: number;
}

export interface EditorSaveResponse {
  lockVersion: number;
}

export interface MediaUploadResponse {
  images: Array<{ url: string }>;
}

export interface UseEditablePageTitleOptions {
  pageId?: number;
  initialTitle: string;
}

export interface UseInlineElementEditingOptions {
  element: EditorElement;
  onUpdate: (id: string, updates: Partial<EditorElement>) => void;
  onContentRendered?: (element: HTMLDivElement) => void;
}

export interface UseEditorCanvasInteractionsOptions {
  addElement: (element: EditorElement) => void;
  onDropImageFiles: (
    files: File[],
    targetElementId: string | null,
  ) => Promise<void>;
}

export interface UseElementReorderingOptions {
  index: number;
  onMove: (dragIndex: number, insertionIndex: number) => void;
}

export interface UseContainerColumnsOptions {
  element: EditorElement;
  onUpdate: (id: string, updates: Partial<EditorElement>) => void;
  onMoveElementToColumn: (
    item: ColumnElementDragItem,
    targetParentId: string,
    targetColumnIndex: number,
    insertionIndex: number,
  ) => void;
}

export interface UseEmbeddedImageEditingOptions {
  elementRef: RefObject<HTMLDivElement | null>;
  editableRef: RefObject<HTMLDivElement | null>;
  saveContent: () => void;
  onSelect: () => void;
}

export interface UseColumnElementDragDropOptions {
  element: EditorElement;
  index: number;
  parentId: string;
  columnIndex: number;
  elementRef: RefObject<HTMLDivElement | null>;
  editableRef: RefObject<HTMLDivElement | null>;
  embeddedImageId?: string;
  setDraftContent: (content: string) => void;
  onUpdate: (id: string, updates: Partial<EditorElement>) => void;
  onSelect: () => void;
  onMove: (item: ColumnElementDragItem, insertionIndex: number) => void;
  onInsertNew: (element: EditorElement, insertionIndex: number) => void;
  positionEmbeddedImage: (image: HTMLImageElement) => void;
}

export interface UseColumnDropZoneOptions {
  elementCount: number;
  onAddToColumn: (element: EditorElement, insertionIndex?: number) => void;
  onMoveElement: (
    item: ColumnElementDragItem,
    insertionIndex: number,
  ) => void;
}

export interface TreeInsertionResult {
  nodes: EditorElement[];
  inserted: boolean;
}

export const COLUMN_ELEMENT_DRAG_TYPE = 'column-element';

export const DEFAULT_PROPERTIES = {
  padding: '0',
  paddingLinked: true,
  margin: '0',
  marginLinked: true,
  backgroundColor: 'transparent',
  float: 'none' as const,
  textAlign: 'left' as const,
  contentAlign: 'left' as const,
  verticalAlign: 'top' as const,
  fontSize: '16',
  color: '#000000',
  borderRadius: '0',
  columnGap: '20',
};
