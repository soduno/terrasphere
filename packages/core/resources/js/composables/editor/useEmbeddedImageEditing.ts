import { useState, type MouseEvent } from 'react';
import type {
  ElementAlignment,
  EmbeddedImageOverlay,
  UseEmbeddedImageEditingOptions,
} from '../../types/editor';

export function initializeEmbeddedImages(element: HTMLDivElement) {
  element.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
    image.dataset.editorEmbeddedImage ||=
      `embedded-image-${Date.now()}-${Math.random()}`;
    image.draggable = false;
  });
}

export function useEmbeddedImageEditing({
  elementRef,
  editableRef,
  saveContent,
  onSelect,
}: UseEmbeddedImageEditingOptions) {
  const [image, setImage] = useState<EmbeddedImageOverlay | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const findImage = () => image
    ? editableRef.current?.querySelector<HTMLImageElement>(
        `img[data-editor-embedded-image="${image.id}"]`,
      )
    : null;

  const positionImage = (target: HTMLImageElement) => {
    if (!elementRef.current) return;

    const imageBounds = target.getBoundingClientRect();
    const elementBounds = elementRef.current.getBoundingClientRect();
    setImage({
      id: target.dataset.editorEmbeddedImage || '',
      left: imageBounds.left - elementBounds.left,
      top: imageBounds.top - elementBounds.top,
      width: imageBounds.width,
      viewportLeft: imageBounds.left,
      viewportTop: imageBounds.top,
      widthPercent:
        Number.parseInt(target.style.width || '100', 10) || 100,
      alignment:
        target.style.marginLeft === 'auto'
        && target.style.marginRight === 'auto'
          ? 'center'
          : target.style.marginLeft === 'auto'
            ? 'right'
            : 'left',
      float:
        target.style.float === 'left' || target.style.float === 'right'
          ? target.style.float
          : 'none',
    });
  };

  const saveAndReposition = (target: HTMLImageElement) => {
    saveContent();
    requestAnimationFrame(() => positionImage(target));
  };

  const handleImageClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = (event.target as Element).closest<HTMLImageElement>(
      'img[data-editor-embedded-image]',
    );
    if (!target || !editableRef.current?.contains(target)) {
      setImage(null);
      return;
    }

    event.stopPropagation();
    onSelect();
    setShowSettings(false);
    positionImage(target);
  };

  const duplicate = () => {
    const target = findImage();
    if (!target) return;

    const duplicateImage = target.cloneNode(true) as HTMLImageElement;
    duplicateImage.dataset.editorEmbeddedImage =
      `embedded-image-${Date.now()}-${Math.random()}`;
    target.after(duplicateImage);
    saveAndReposition(duplicateImage);
  };

  const remove = () => {
    findImage()?.remove();
    saveContent();
    setImage(null);
  };

  const changeWidth = (width: number) => {
    const target = findImage();
    if (!target) return;
    target.style.width = `${width}%`;
    saveAndReposition(target);
  };

  const changeAlignment = (alignment: ElementAlignment) => {
    const target = findImage();
    if (!target) return;
    target.style.marginLeft = alignment === 'left' ? '0' : 'auto';
    target.style.marginRight = alignment === 'right' ? '0' : 'auto';
    saveAndReposition(target);
  };

  const changeFloat = (float: 'none' | 'left' | 'right') => {
    const target = findImage();
    if (!target || !image) return;

    target.style.float = float === 'none' ? '' : float;
    if (float === 'left') {
      target.style.marginLeft = '0';
      target.style.marginRight = '12px';
    } else if (float === 'right') {
      target.style.marginLeft = '12px';
      target.style.marginRight = '0';
    } else {
      target.style.marginLeft = image.alignment === 'left' ? '0' : 'auto';
      target.style.marginRight = image.alignment === 'right' ? '0' : 'auto';
    }
    saveAndReposition(target);
  };

  return {
    image,
    showSettings,
    initializeEmbeddedImages,
    handleImageClick,
    positionImage,
    clearImage: () => setImage(null),
    toggleSettings: () => setShowSettings((current) => !current),
    duplicate,
    remove,
    changeWidth,
    changeAlignment,
    changeFloat,
  };
}
