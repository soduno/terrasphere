import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDrag, useDrop } from 'react-dnd';
import { AlignCenter, AlignLeft, AlignRight, Copy, Move, Settings, Trash2 } from 'lucide-react';
import { EditorElement } from './ElementTypes';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Calendar } from '../ui/calendar';

interface ColumnElementProps {
  element: EditorElement;
  index: number;
  dragType: string;
  elementGap: string;
  isLast: boolean;
  isSelected: boolean;
  isHovered: boolean;
  showToolbar: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<EditorElement>) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onInsertNew: (element: EditorElement, insertionIndex: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

interface ColumnDropItem {
  index?: number;
  dropPosition?: 'before' | 'after';
  elementType?: EditorElement['type'];
  createElement?: () => EditorElement;
  embeddedImageId?: string;
  isLayout?: boolean;
}

interface EmbeddedImageOverlay {
  id: string;
  left: number;
  top: number;
  width: number;
  viewportLeft: number;
  viewportTop: number;
  widthPercent: number;
  alignment: 'left' | 'center' | 'right';
  float: 'none' | 'left' | 'right';
}

export function ColumnElement({
  element,
  index,
  dragType,
  elementGap,
  isLast,
  isSelected,
  isHovered,
  showToolbar,
  onSelect,
  onUpdate,
  onMove,
  onInsertNew,
  onDuplicate,
  onDelete,
}: ColumnElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const draftContentRef = useRef<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('before');
  const [embeddedImage, setEmbeddedImage] = useState<EmbeddedImageOverlay | null>(null);
  const [embeddedDropY, setEmbeddedDropY] = useState<number | null>(null);
  const [embeddedInsertionIndex, setEmbeddedInsertionIndex] = useState(0);
  const [showEmbeddedSettings, setShowEmbeddedSettings] = useState(false);
  const [imageDropPoint, setImageDropPoint] = useState<{
    localY: number;
    insertionIndex: number;
  } | null>(null);
  const embeddedDragType = `embedded-image-${element.id}`;
  const floatDirection = element.properties.float || 'none';

  const getContentInsertionPoint = (clientY: number) => {
    const target = editableRef.current;
    const root = elementRef.current;
    if (!target || !root) return { localY: 0, insertionIndex: 0 };

    const rootBounds = root.getBoundingClientRect();
    const targetBounds = target.getBoundingClientRect();
    const children = Array.from(target.children);
    const boundaries = children.length > 0
      ? [
          children[0].getBoundingClientRect().top,
          ...children.map((child) => child.getBoundingClientRect().bottom),
        ]
      : [targetBounds.top, targetBounds.bottom];
    let insertionIndex = 0;

    boundaries.forEach((boundary, index) => {
      if (
        Math.abs(clientY - boundary)
        < Math.abs(clientY - boundaries[insertionIndex])
      ) {
        insertionIndex = index;
      }
    });

    return {
      insertionIndex,
      localY: Math.max(
        0,
        Math.min(boundaries[insertionIndex] - rootBounds.top, rootBounds.height)
      ),
    };
  };

  const insertAtContentBoundary = (node: Node, insertionIndex: number) => {
    const target = editableRef.current;
    if (!target) return;
    const children = Array.from(target.children);
    const reference = children[insertionIndex] ?? null;

    if (children.length === 0 && insertionIndex === 0) {
      target.insertBefore(node, target.firstChild);
    } else if (reference) {
      target.insertBefore(node, reference);
    } else {
      target.appendChild(node);
    }
  };

  const [{ isDragging }, drag, preview] = useDrag({
    type: dragType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, embeddedDrag] = useDrag({
    type: embeddedDragType,
    item: () => ({ embeddedImageId: embeddedImage?.id }),
    canDrag: () => !!embeddedImage,
  });

  const [{ isOverTarget, isOverImageTarget, isOverEmbeddedTarget, isOverNewElementTarget }, drop] = useDrop<
    ColumnDropItem,
    { handled: true } | void,
    {
      isOverTarget: boolean;
      isOverImageTarget: boolean;
      isOverEmbeddedTarget: boolean;
      isOverNewElementTarget: boolean;
    }
  >({
    accept: [dragType, 'new-element', embeddedDragType],
    canDrop: (item, monitor) => {
      if (monitor.getItemType() === dragType) return true;
      if (monitor.getItemType() === embeddedDragType) return !!item.embeddedImageId;
      return !item.isLayout;
    },
    hover: (item, monitor) => {
      if (!elementRef.current) return;
      const pointer = monitor.getClientOffset();
      if (!pointer) return;

      const bounds = elementRef.current.getBoundingClientRect();
      if (monitor.getItemType() === embeddedDragType) {
        const insertion = getContentInsertionPoint(pointer.y);
        setEmbeddedDropY(insertion.localY);
        setEmbeddedInsertionIndex(insertion.insertionIndex);
        return;
      }

      if (
        monitor.getItemType() === 'new-element'
        && item.elementType === 'image'
        && (element.type === 'text' || element.type === 'wysiwyg')
      ) {
        const insertion = getContentInsertionPoint(pointer.y);
        setImageDropPoint({
          localY: insertion.localY,
          insertionIndex: insertion.insertionIndex,
        });
        return;
      }

      const position = pointer.y < bounds.top + bounds.height / 2 ? 'before' : 'after';
      item.dropPosition = position;
      setDropPosition(position);
    },
    drop: (item, monitor) => {
      if (monitor.getItemType() === embeddedDragType) {
        const target = editableRef.current;
        const image = item.embeddedImageId
          ? target?.querySelector<HTMLImageElement>(
              `img[data-editor-embedded-image="${item.embeddedImageId}"]`
            )
          : null;
        if (!target || !image) return;

        const previousParent = image.parentElement;
        insertAtContentBoundary(image, embeddedInsertionIndex);
        if (
          previousParent
          && previousParent !== target
          && !previousParent.textContent?.trim()
          && !previousParent.querySelector('img')
        ) {
          previousParent.remove();
        }
        const content = target.innerHTML;
        draftContentRef.current = content;
        onUpdate(element.id, { content });
        requestAnimationFrame(() => positionEmbeddedToolbar(image));
        setEmbeddedDropY(null);
        return { handled: true };
      }

      if (monitor.getItemType() === 'new-element') {
        if (!item.createElement) return;
        const shouldEmbedImage =
          item.elementType === 'image'
          && (element.type === 'text' || element.type === 'wysiwyg');

        if (!shouldEmbedImage) {
          const insertionIndex = (item.dropPosition ?? dropPosition) === 'after'
            ? index + 1
            : index;
          onInsertNew(item.createElement(), insertionIndex);
          return { handled: true };
        }

        const target = editableRef.current;
        if (!target || !imageDropPoint || item.elementType !== 'image') return;

        const imageElement = item.createElement();
        const image = document.createElement('img');
        image.src = imageElement.properties.imageUrl || '';
        image.alt = 'Content';
        image.draggable = false;
        image.dataset.editorEmbeddedImage = `embedded-image-${Date.now()}-${Math.random()}`;
        image.style.display = 'block';
        image.style.maxWidth = '100%';
        image.style.width = imageElement.properties.imageWidth || '100%';
        image.style.height = imageElement.properties.imageHeight || 'auto';
        image.style.borderRadius = `${imageElement.properties.borderRadius || 0}px`;

        if (imageElement.properties.imageAlign === 'center') {
          image.style.marginLeft = 'auto';
          image.style.marginRight = 'auto';
        } else if (imageElement.properties.imageAlign === 'right') {
          image.style.marginLeft = 'auto';
          image.style.marginRight = '0';
        } else {
          image.style.marginLeft = '0';
          image.style.marginRight = 'auto';
        }

        insertAtContentBoundary(image, imageDropPoint?.insertionIndex ?? 0);

        const content = target.innerHTML;
        draftContentRef.current = content;
        onUpdate(element.id, { content });
        onSelect();
        requestAnimationFrame(() => positionEmbeddedToolbar(image));
        setImageDropPoint(null);
        return { handled: true };
      }

      if (item.index === undefined || item.index === index) return;
      const insertionIndex =
        (item.dropPosition ?? dropPosition) === 'after' ? index + 1 : index;
      onMove(item.index, insertionIndex);
      return { handled: true };
    },
    collect: (monitor) => ({
      isOverTarget:
        monitor.isOver({ shallow: true }) && monitor.getItemType() === dragType,
      isOverImageTarget:
        monitor.isOver({ shallow: true })
        && monitor.getItemType() === 'new-element'
        && monitor.getItem()?.elementType === 'image',
      isOverEmbeddedTarget:
        monitor.isOver({ shallow: true })
        && monitor.getItemType() === embeddedDragType,
      isOverNewElementTarget:
        monitor.isOver({ shallow: true })
        && monitor.getItemType() === 'new-element'
        && !(
          monitor.getItem()?.elementType === 'image'
          && (element.type === 'text' || element.type === 'wysiwyg')
        ),
    }),
  });

  preview(drop(elementRef));

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (element.type === 'text' || element.type === 'heading' || element.type === 'wysiwyg') {
      e.stopPropagation();
      draftContentRef.current = e.currentTarget.innerHTML;
      setIsEditing(true);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    draftContentRef.current = e.currentTarget.innerHTML;
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const content = draftContentRef.current ?? e.currentTarget.innerHTML;
    draftContentRef.current = null;
    onUpdate(element.id, { content });
    setIsEditing(false);
  };

  const saveEditableContent = () => {
    if (!editableRef.current) return;
    const content = editableRef.current.innerHTML;
    draftContentRef.current = content;
    onUpdate(element.id, { content });
  };

  const positionEmbeddedToolbar = (image: HTMLImageElement) => {
    if (!elementRef.current) return;
    const imageBounds = image.getBoundingClientRect();
    const elementBounds = elementRef.current.getBoundingClientRect();
    setEmbeddedImage({
      id: image.dataset.editorEmbeddedImage || '',
      left: imageBounds.left - elementBounds.left,
      top: imageBounds.top - elementBounds.top,
      width: imageBounds.width,
      viewportLeft: imageBounds.left,
      viewportTop: imageBounds.top,
      widthPercent: Number.parseInt(image.style.width || '100', 10) || 100,
      alignment:
        image.style.marginLeft === 'auto' && image.style.marginRight === 'auto'
          ? 'center'
          : image.style.marginLeft === 'auto'
            ? 'right'
            : 'left',
      float:
        image.style.float === 'left' || image.style.float === 'right'
          ? image.style.float
          : 'none',
    });
  };

  const handleEmbeddedImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const image = (e.target as Element).closest<HTMLImageElement>(
      'img[data-editor-embedded-image]'
    );
    if (!image || !editableRef.current?.contains(image)) {
      setEmbeddedImage(null);
      return;
    }

    e.stopPropagation();
    onSelect();
    setShowEmbeddedSettings(false);
    positionEmbeddedToolbar(image);
  };

  useLayoutEffect(() => {
    if (!isEditing && editableRef.current) {
      const defaultContent =
        element.type === 'heading'
          ? 'Heading Text'
          : element.type === 'wysiwyg'
            ? '<p>Start writing...</p>'
            : 'Click to edit...';
      const content = element.content || defaultContent;

      if (editableRef.current.innerHTML !== content) {
        editableRef.current.innerHTML = content;
      }

      editableRef.current.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
        image.dataset.editorEmbeddedImage ||= `embedded-image-${Date.now()}-${Math.random()}`;
        image.draggable = false;
      });
    }
  }, [element.content, element.type, isEditing]);

  const renderElement = () => {
    const style = {
      paddingTop: `${element.properties.paddingTop ?? element.properties.padding ?? 0}px`,
      paddingRight: `${element.properties.paddingRight ?? element.properties.padding ?? 0}px`,
      paddingBottom: `${element.properties.paddingBottom ?? element.properties.padding ?? 0}px`,
      paddingLeft: `${element.properties.paddingLeft ?? element.properties.padding ?? 0}px`,
      marginTop: `${element.properties.marginTop ?? element.properties.margin ?? 0}px`,
      marginRight: `${element.properties.marginRight ?? element.properties.margin ?? 0}px`,
      marginBottom: `${element.properties.marginBottom ?? element.properties.margin ?? 0}px`,
      marginLeft: `${element.properties.marginLeft ?? element.properties.margin ?? 0}px`,
      backgroundColor: element.properties.backgroundColor || 'transparent',
      textAlign: element.properties.contentAlign || element.properties.textAlign || 'left',
      fontSize: `${element.properties.fontSize || 14}px`,
      color: element.properties.color || '#000000',
      borderRadius: `${element.properties.borderRadius || 0}px`,
    } as React.CSSProperties;

    switch (element.type) {
      case 'heading':
        return (
          <div
            ref={editableRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onDoubleClick={handleDoubleClick}
            onInput={handleInput}
            onBlur={handleBlur}
            style={style}
            className={`outline-none transition-all ${
              isEditing ? 'ring-2 ring-indigo-500 rounded-lg' : ''
            } ${!isEditing ? 'cursor-text' : ''}`}
          />
        );

      case 'text':
        return (
          <div
            ref={editableRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onDoubleClick={handleDoubleClick}
            onInput={handleInput}
            onBlur={handleBlur}
            onClick={handleEmbeddedImageClick}
            style={style}
            className={`outline-none transition-all ${
              isEditing ? 'ring-2 ring-indigo-500 rounded-lg' : ''
            } ${!isEditing ? 'cursor-text' : ''}`}
          />
        );

      case 'wysiwyg':
        return (
          <div
            ref={editableRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onDoubleClick={handleDoubleClick}
            onInput={handleInput}
            onBlur={handleBlur}
            onClick={handleEmbeddedImageClick}
            style={style}
            className={`outline-none transition-all min-h-[60px] ${
              isEditing ? 'ring-2 ring-indigo-500 rounded-lg' : ''
            } ${!isEditing ? 'cursor-text' : ''}`}
          />
        );

      case 'image':
        return (
          <div
            style={{
              ...style,
              display: 'flex',
              justifyContent:
                (element.properties.contentAlign || element.properties.imageAlign) === 'center'
                  ? 'center'
                  : (element.properties.contentAlign || element.properties.imageAlign) === 'right'
                    ? 'flex-end'
                    : 'flex-start',
            }}
          >
            <ImageWithFallback
              src={element.properties.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'}
              alt="Content"
              className="max-w-full rounded-lg object-cover"
              style={{
                width:
                  floatDirection === 'none'
                    ? element.properties.imageWidth || '100%'
                    : '100%',
                height: element.properties.imageHeight || 'auto',
                borderRadius: `${element.properties.borderRadius || 0}px`,
              }}
            />
          </div>
        );

      case 'calendar':
        return (
          <div
            style={{
              ...style,
              display: 'flex',
              justifyContent:
                element.properties.contentAlign === 'left'
                  ? 'flex-start'
                  : element.properties.contentAlign === 'right'
                    ? 'flex-end'
                    : 'center',
            }}
          >
            <Calendar
              mode="single"
              className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm scale-90"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={elementRef}
      className={`relative group ${embeddedImage ? 'z-30' : ''}`}
      data-editor-element-id={element.id}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        opacity: isDragging ? 0.4 : 1,
        display: floatDirection === 'none' ? 'flex' : 'flow-root',
        flex: floatDirection === 'none' ? '1 1 0%' : undefined,
        flexDirection: floatDirection === 'none' ? 'column' : undefined,
        float: floatDirection === 'none' ? undefined : floatDirection,
        width:
          floatDirection === 'none'
            ? undefined
            : element.type === 'image'
              ? element.properties.imageWidth || '100%'
              : 'fit-content',
        maxWidth: '100%',
        marginBottom: isLast ? undefined : `${elementGap}px`,
      }}
    >
      {isOverImageTarget && imageDropPoint && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-30 h-0.5 bg-indigo-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
          style={{ top: imageDropPoint.localY }}
        >
          <span className="absolute -left-1 -top-[3px] size-2 rounded-full border-2 border-indigo-500 bg-white" />
          <span className="absolute -right-1 -top-[3px] size-2 rounded-full border-2 border-indigo-500 bg-white" />
        </div>
      )}

      {isOverEmbeddedTarget && embeddedDropY !== null && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-40 h-0.5 bg-indigo-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
          style={{ top: embeddedDropY }}
        >
          <span className="absolute -left-1 -top-[3px] size-2 rounded-full border-2 border-indigo-500 bg-white" />
          <span className="absolute -right-1 -top-[3px] size-2 rounded-full border-2 border-indigo-500 bg-white" />
        </div>
      )}

      {embeddedImage && isSelected && (
        <div
          className="pointer-events-auto absolute z-[90] flex h-6 -translate-x-1/2 -translate-y-full items-center rounded-sm bg-indigo-600 px-1 text-white"
          style={{
            left: embeddedImage.left + embeddedImage.width / 2,
            top: embeddedImage.top,
          }}
        >
          <span
            ref={(node) => {
              embeddedDrag(node);
            }}
            className="flex h-full cursor-move items-center px-1.5 text-white/85 hover:bg-white/15 hover:text-white"
            title="Move image"
          >
            <Move className="size-3.5" />
          </span>
          <div className="h-3.5 w-px bg-white/25" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEmbeddedSettings((current) => !current);
            }}
            className="flex h-full items-center px-1.5 text-white/85 hover:bg-white/15 hover:text-white"
            title="Image settings"
          >
            <Settings className="size-3.5" />
          </button>
          <div className="h-3.5 w-px bg-white/25" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const target = editableRef.current?.querySelector<HTMLImageElement>(
                `img[data-editor-embedded-image="${embeddedImage.id}"]`
              );
              if (!target) return;

              const duplicate = target.cloneNode(true) as HTMLImageElement;
              duplicate.dataset.editorEmbeddedImage =
                `embedded-image-${Date.now()}-${Math.random()}`;
              target.after(duplicate);
              saveEditableContent();
              positionEmbeddedToolbar(duplicate);
            }}
            className="flex h-full items-center px-1.5 text-white/85 hover:bg-white/15 hover:text-white"
            title="Duplicate image"
          >
            <Copy className="size-3.5" />
          </button>
          <div className="h-3.5 w-px bg-white/25" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const target = editableRef.current?.querySelector<HTMLImageElement>(
                `img[data-editor-embedded-image="${embeddedImage.id}"]`
              );
              target?.remove();
              saveEditableContent();
              setEmbeddedImage(null);
            }}
            className="flex h-full items-center px-1.5 text-white/85 hover:bg-red-500/35 hover:text-white"
            title="Delete image"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}

      {embeddedImage && isSelected && showEmbeddedSettings && createPortal(
        <div
          className="pointer-events-auto fixed z-[9999] w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-gray-700 shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          style={{
            left: embeddedImage.viewportLeft + embeddedImage.width / 2,
            top: embeddedImage.viewportTop + 6,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium">Image settings</span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {embeddedImage.widthPercent}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={embeddedImage.widthPercent}
            onChange={(e) => {
              const image = editableRef.current?.querySelector<HTMLImageElement>(
                `img[data-editor-embedded-image="${embeddedImage.id}"]`
              );
              if (!image) return;

              image.style.width = `${e.target.value}%`;
              saveEditableContent();
              requestAnimationFrame(() => positionEmbeddedToolbar(image));
            }}
            className="h-1.5 w-full cursor-pointer accent-indigo-600"
            aria-label="Embedded image width"
          />
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-md bg-gray-100 p-1 dark:bg-gray-900/60">
            {([
              { value: 'left', label: 'Left', Icon: AlignLeft },
              { value: 'center', label: 'Center', Icon: AlignCenter },
              { value: 'right', label: 'Right', Icon: AlignRight },
            ] as const).map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                title={`${label} align`}
                onClick={() => {
                  const image = editableRef.current?.querySelector<HTMLImageElement>(
                    `img[data-editor-embedded-image="${embeddedImage.id}"]`
                  );
                  if (!image) return;

                  image.style.marginLeft = value === 'left' ? '0' : 'auto';
                  image.style.marginRight = value === 'right' ? '0' : 'auto';
                  saveEditableContent();
                  requestAnimationFrame(() => positionEmbeddedToolbar(image));
                }}
                className={`flex h-7 items-center justify-center rounded text-xs transition-colors ${
                  embeddedImage.alignment === value
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-300'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </div>
          <div className="mt-3">
            <span className="mb-1.5 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
              Float
            </span>
            <div className="grid grid-cols-3 gap-1 rounded-md bg-gray-100 p-1 dark:bg-gray-900/60">
              {(['none', 'left', 'right'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    const image = editableRef.current?.querySelector<HTMLImageElement>(
                      `img[data-editor-embedded-image="${embeddedImage.id}"]`
                    );
                    if (!image) return;

                    image.style.float = value === 'none' ? '' : value;
                    if (value === 'left') {
                      image.style.marginLeft = '0';
                      image.style.marginRight = '12px';
                    } else if (value === 'right') {
                      image.style.marginLeft = '12px';
                      image.style.marginRight = '0';
                    } else {
                      image.style.marginLeft =
                        embeddedImage.alignment === 'left' ? '0' : 'auto';
                      image.style.marginRight =
                        embeddedImage.alignment === 'right' ? '0' : 'auto';
                    }

                    saveEditableContent();
                    requestAnimationFrame(() => positionEmbeddedToolbar(image));
                  }}
                  className={`h-7 rounded text-[11px] capitalize transition-colors ${
                    embeddedImage.float === value
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-300'
                      : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

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

      {isOverNewElementTarget && (
        <div
          className={`pointer-events-none absolute left-0 right-0 z-30 h-0.5 bg-indigo-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)] ${
            dropPosition === 'before' ? '-top-px' : '-bottom-px'
          }`}
        >
          <span className="absolute -left-1 -top-[3px] size-2 rounded-full border-2 border-indigo-500 bg-white" />
          <span className="absolute -right-1 -top-[3px] size-2 rounded-full border-2 border-indigo-500 bg-white" />
        </div>
      )}

      {/* Element Toolbar */}
      {showToolbar && !isEditing && (
        <div className="absolute -top-6 left-1/2 z-20 flex h-6 -translate-x-1/2 items-center rounded-sm bg-indigo-600 px-1 text-white animate-in fade-in duration-150">
          <span
            ref={(node) => {
              drag(node);
            }}
            className="flex h-full cursor-move items-center px-1.5 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
            title="Move element"
          >
            <Move className="size-3.5" />
          </span>
          <div className="h-3.5 w-px bg-white/25" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="flex h-full items-center px-1.5 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
            title="Settings"
          >
            <Settings className="size-3.5" />
          </button>
          <div className="h-3.5 w-px bg-white/25" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="flex h-full items-center px-1.5 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
            title="Duplicate"
          >
            <Copy className="size-3.5" />
          </button>
          <div className="h-3.5 w-px bg-white/25" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex h-full items-center px-1.5 text-white/85 transition-colors hover:bg-red-500/35 hover:text-white"
            title="Delete"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}

      {/* Hover Border */}
      {(isHovered || isSelected) && !isEditing && (
        <svg
          aria-hidden="true"
          className="absolute -inset-0.5 h-[calc(100%+4px)] w-[calc(100%+4px)] overflow-visible pointer-events-none text-indigo-500/80 animate-in fade-in duration-150"
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

      {/* Element Content */}
      <div
        className={`${isEditing ? 'relative z-20' : ''} flex flex-1 flex-col rounded-lg`}
        style={{
          justifyContent:
            element.properties.verticalAlign === 'center'
              ? 'center'
              : element.properties.verticalAlign === 'bottom'
                ? 'flex-end'
                : 'flex-start',
        }}
      >
        {renderElement()}
      </div>

      {/* Edit Hint */}
      {(element.type === 'text' || element.type === 'heading' || element.type === 'wysiwyg') && 
       isHovered && 
       !isEditing && (
        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-gray-900/70 text-white text-[10px] rounded z-10">
          Double-click
        </div>
      )}
    </div>
  );
}
