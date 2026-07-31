import { Link } from '@inertiajs/react';
import { api, ApiError } from '@adapter/api';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import {
  ArrowLeft,
  Check,
  Crop,
  ImageIcon,
  LoaderCircle,
  Maximize2,
  Pencil,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ImageEditor,
  clamp,
  cropToAspect,
  exportMimeType,
  extensionForMimeType,
  formatForMimeType,
  mimeTypeForFormat,
  sizeFromHeight,
  sizeFromWidth,
  wholeImage,
  type ImageFormat,
  type ImageCrop,
} from '../../lib/imageEditor';

interface EditableImage {
  uuid: string;
  name: string;
  url: string;
  saveUrl: string;
  renameUrl: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
}

interface MediaEditProps {
  [key: string]: unknown;
  image: EditableImage;
  formats: SupportedImageFormat[];
}

interface SupportedImageFormat {
  value: ImageFormat;
  label: string;
  mimeType: string;
}

type DragState =
  | { type: 'create'; startX: number; startY: number }
  | { type: 'move'; startX: number; startY: number; area: ImageCrop };

const minimumCropSize = 8;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaEdit({ image, formats }: MediaEditProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [sourceUrl, setSourceUrl] = useState(image.url);
  const [imageName, setImageName] = useState(image.name);
  const [savedImageName, setSavedImageName] = useState(image.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [sourceWidth, setSourceWidth] = useState(image.width);
  const [sourceHeight, setSourceHeight] = useState(image.height);
  const [sourceSize, setSourceSize] = useState(image.size);
  const [sourceMimeType, setSourceMimeType] = useState(image.mimeType);
  const saveFormat = (() => {
    const sourceFormat = formatForMimeType(image.mimeType);

    return formats.find((format) => format.value === sourceFormat)?.value
      ?? formats.find((format) => format.value === 'png')?.value
      ?? formats[0]?.value
      ?? 'png';
  })();
  const [cropArea, setCropArea] = useState(() => wholeImage(image.width, image.height));
  const [isCropActive, setIsCropActive] = useState(false);
  const [outputWidth, setOutputWidth] = useState(image.width);
  const [outputHeight, setOutputHeight] = useState(image.height);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const cropPercent = {
    left: `${(cropArea.x / sourceWidth) * 100}%`,
    top: `${(cropArea.y / sourceHeight) * 100}%`,
    width: `${(cropArea.width / sourceWidth) * 100}%`,
    height: `${(cropArea.height / sourceHeight) * 100}%`,
  };

  useEffect(() => {
    setOutputWidth(cropArea.width);
    setOutputHeight(cropArea.height);
  }, [cropArea.height, cropArea.width]);

  useEffect(() => {
    const leaveCrop = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !isCropActive) return;

      dragRef.current = null;
      setCropArea(wholeImage(sourceWidth, sourceHeight));
      setIsCropActive(false);
      setSaved(false);
    };

    window.addEventListener('keydown', leaveCrop);

    return () => window.removeEventListener('keydown', leaveCrop);
  }, [isCropActive, sourceHeight, sourceWidth]);

  const clearCrop = () => {
    dragRef.current = null;
    setCropArea(wholeImage(sourceWidth, sourceHeight));
    setIsCropActive(false);
    setSaved(false);
  };

  const pointInImage = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const bounds = element.getBoundingClientRect();

    return {
      x: clamp(
        ((event.clientX - bounds.left) / bounds.width) * sourceWidth,
        0,
        sourceWidth,
      ),
      y: clamp(
        ((event.clientY - bounds.top) / bounds.height) * sourceHeight,
        0,
        sourceHeight,
      ),
    };
  };

  const beginSelection = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isSaving) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointInImage(event);
    const isInside = point.x >= cropArea.x
      && point.x <= cropArea.x + cropArea.width
      && point.y >= cropArea.y
      && point.y <= cropArea.y + cropArea.height;
    const coversWholeImage = cropArea.x === 0
      && cropArea.y === 0
      && cropArea.width === sourceWidth
      && cropArea.height === sourceHeight;

    dragRef.current = isCropActive && isInside && !coversWholeImage
      ? { type: 'move', startX: point.x, startY: point.y, area: cropArea }
      : { type: 'create', startX: point.x, startY: point.y };
    setSaved(false);
  };

  const updateSelection = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const point = pointInImage(event);

    if (drag.type === 'move') {
      setCropArea({
        ...drag.area,
        x: clamp(
          drag.area.x + point.x - drag.startX,
          0,
          sourceWidth - drag.area.width,
        ),
        y: clamp(
          drag.area.y + point.y - drag.startY,
          0,
          sourceHeight - drag.area.height,
        ),
      });
      return;
    }

    setIsCropActive(true);
    let x = Math.min(drag.startX, point.x);
    let y = Math.min(drag.startY, point.y);
    const width = Math.max(minimumCropSize, Math.round(Math.abs(point.x - drag.startX)));
    const height = Math.max(minimumCropSize, Math.round(Math.abs(point.y - drag.startY)));
    x = Math.min(x, sourceWidth - width);
    y = Math.min(y, sourceHeight - height);
    setCropArea({
      x: Math.max(0, Math.round(x)),
      y: Math.max(0, Math.round(y)),
      width: Math.min(sourceWidth, width),
      height: Math.min(sourceHeight, height),
    });
  };

  const finishSelection = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      updateSelection(event);
      dragRef.current = null;
    }
  };

  const setAspectRatio = (ratio: number | null) => {
    if (ratio === null) {
      clearCrop();
      return;
    }

    const next = cropToAspect(
      { width: sourceWidth, height: sourceHeight },
      ratio,
    );
    setCropArea(next);
    setIsCropActive(true);
    setOutputWidth(next.width);
    setOutputHeight(next.height);
    setSaved(false);
  };

  const changeWidth = (value: number) => {
    const width = clamp(Math.round(value || 1), 1, 12000);
    setOutputWidth(width);
    setSaved(false);
    if (lockAspectRatio) {
      setOutputHeight(sizeFromWidth(cropArea, width).height);
    }
  };

  const changeHeight = (value: number) => {
    const height = clamp(Math.round(value || 1), 1, 12000);
    setOutputHeight(height);
    setSaved(false);
    if (lockAspectRatio) {
      setOutputWidth(sizeFromHeight(cropArea, height).width);
    }
  };

  const saveImageName = async () => {
    if (isSavingName) return;

    const name = imageName.trim();
    if (!name) {
      setNameError('The image name cannot be empty.');
      return;
    }

    setIsEditingName(false);
    setNameError(null);

    if (name === savedImageName) {
      setImageName(name);
      return;
    }

    setIsSavingName(true);

    try {
      const response = await api.patch<{ image: { name: string } }>(
        image.renameUrl,
        { name },
      );
      setImageName(response.image.name);
      setSavedImageName(response.image.name);
    } catch (reason) {
      if (reason instanceof ApiError) {
        setNameError(
          Object.values(reason.errors).flat()[0] ?? reason.message,
        );
      } else {
        setNameError(
          reason instanceof Error ? reason.message : 'The image name could not be saved.',
        );
      }
      setIsEditingName(true);
    } finally {
      setIsSavingName(false);
    }
  };

  const saveImage = async () => {
    const source = imageRef.current;
    if (!source || !source.complete || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const requestedMimeType = exportMimeType(mimeTypeForFormat(saveFormat));
      const editor = new ImageEditor(source);
      const blob = await editor.export({
        crop: cropArea,
        width: outputWidth,
        height: outputHeight,
        mimeType: requestedMimeType,
        quality: requestedMimeType === 'image/jpeg' ? 0.92 : undefined,
      });
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('format', saveFormat);
      formData.append(
        'image',
        new File([blob], `${image.uuid}.${extensionForMimeType(blob.type)}`, { type: blob.type }),
      );

      const response = await api.post<{
        image: Pick<EditableImage, 'url' | 'mimeType' | 'size' | 'width' | 'height'>;
      }>(image.saveUrl, formData);
      const versionedUrl = `${response.image.url}?v=${Date.now()}`;

      setSourceUrl(versionedUrl);
      setSourceWidth(response.image.width);
      setSourceHeight(response.image.height);
      setSourceSize(response.image.size);
      setSourceMimeType(response.image.mimeType);
      setCropArea(wholeImage(response.image.width, response.image.height));
      setIsCropActive(false);
      setOutputWidth(response.image.width);
      setOutputHeight(response.image.height);
      setSaved(true);
    } catch (reason) {
      if (reason instanceof ApiError) {
        setSaveError(
          Object.values(reason.errors).flat()[0] ?? reason.message,
        );
      } else {
        setSaveError(reason instanceof Error ? reason.message : 'The image could not be saved.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const saveCropWithEnter = (event: KeyboardEvent) => {
      if (
        event.key !== 'Enter'
        || !isCropActive
        || isSaving
        || isSavingName
      ) {
        return;
      }

      const target = event.target;
      if (
        target instanceof Element
        && target.closest('input, textarea, select, button, [contenteditable="true"]')
      ) {
        return;
      }

      event.preventDefault();
      void saveImage();
    };

    window.addEventListener('keydown', saveCropWithEnter);

    return () => window.removeEventListener('keydown', saveCropWithEnter);
  }, [isCropActive, isSaving, isSavingName, saveImage]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/media" aria-label="Back to media">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="min-w-0">
            {isEditingName ? (
              <Input
                value={imageName}
                onChange={(event) => {
                  setImageName(event.target.value);
                  setNameError(null);
                }}
                onBlur={() => void saveImageName()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.blur();
                  }

                  if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    setImageName(savedImageName);
                    setNameError(null);
                    setIsEditingName(false);
                  }
                }}
                onFocus={(event) => event.currentTarget.select()}
                autoFocus
                maxLength={255}
                aria-label="Image name"
                className="h-8 min-w-56 max-w-md border-indigo-400 bg-white px-2 text-base font-semibold text-gray-900 ring-2 ring-indigo-500/15 dark:bg-gray-900 dark:text-white"
              />
            ) : (
              <button
                type="button"
                onDoubleClick={() => {
                  if (!isSavingName) {
                    setNameError(null);
                    setIsEditingName(true);
                  }
                }}
                disabled={isSavingName}
                title="Double-click to rename"
                className="group -ml-2 flex max-w-md items-center gap-2 rounded-lg px-2 py-1 text-left text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-wait dark:text-white dark:hover:bg-gray-800"
              >
                <span className="truncate text-base font-semibold">{imageName}</span>
                {isSavingName
                  ? <LoaderCircle className="size-4 shrink-0 animate-spin text-gray-400" />
                  : <Pencil className="size-3.5 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />}
              </button>
            )}
            {nameError && (
              <p className="text-xs text-red-600 dark:text-red-400">{nameError}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {sourceWidth} × {sourceHeight} · {formatFileSize(sourceSize)} ·{' '}
              {sourceMimeType.replace('image/', '').toUpperCase()}
            </p>
          </div>
        </div>
        <Button
          onClick={() => void saveImage()}
          disabled={isSaving || formats.length === 0}
          className="bg-indigo-600 text-white hover:bg-indigo-700 dark:text-white"
        >
          {isSaving ? <LoaderCircle className="animate-spin" /> : saved ? <Check /> : null}
          {isSaving ? 'Saving…' : saved ? 'Saved' : 'Save image'}
        </Button>
      </header>

      <div className="grid flex-1 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="flex min-h-[520px] items-center justify-center overflow-hidden bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0px] p-6 dark:bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%),linear-gradient(-45deg,#1f2937_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f2937_75%),linear-gradient(-45deg,transparent_75%,#1f2937_75%)]">
          <div className="relative inline-block max-h-[calc(100vh-150px)] max-w-full shadow-2xl">
            <img
              ref={imageRef}
              src={sourceUrl}
              alt={imageName}
              draggable={false}
              className="block max-h-[calc(100vh-150px)] max-w-full select-none"
            />
            <div
              className="absolute inset-0 cursor-crosshair touch-none select-none"
              onPointerDown={beginSelection}
              onPointerMove={updateSelection}
              onPointerUp={finishSelection}
              onPointerCancel={() => {
                dragRef.current = null;
              }}
            >
              {isCropActive && (
                <>
                  <div className="absolute inset-x-0 top-0 bg-black/55" style={{ height: cropPercent.top }} />
                  <div
                    className="absolute inset-x-0 bottom-0 bg-black/55"
                    style={{ top: `${((cropArea.y + cropArea.height) / sourceHeight) * 100}%` }}
                  />
                  <div
                    className="absolute left-0 bg-black/55"
                    style={{
                      top: cropPercent.top,
                      width: cropPercent.left,
                      height: cropPercent.height,
                    }}
                  />
                  <div
                    className="absolute right-0 bg-black/55"
                    style={{
                      top: cropPercent.top,
                      left: `${((cropArea.x + cropArea.width) / sourceWidth) * 100}%`,
                      height: cropPercent.height,
                    }}
                  />
                  <div
                    className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.5)]"
                    style={cropPercent}
                  >
                    <span className="absolute left-1/3 top-0 h-full border-l border-white/45" />
                    <span className="absolute left-2/3 top-0 h-full border-l border-white/45" />
                    <span className="absolute left-0 top-1/3 w-full border-t border-white/45" />
                    <span className="absolute left-0 top-2/3 w-full border-t border-white/45" />
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        <aside className="border-l border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <section>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Crop className="size-4" />
              Crop
            </div>
            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
              Drag anywhere on the image to cut out an area. Drag inside the selection to move it.
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[
                { label: 'Free', ratio: null },
                { label: '1:1', ratio: 1 },
                { label: '4:3', ratio: 4 / 3 },
                { label: '16:9', ratio: 16 / 9 },
              ].map((option) => (
                <Button
                  key={option.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setAspectRatio(option.ratio)}
                  className="px-2"
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400">
              {isCropActive ? (
                <>
                  <span>X {Math.round(cropArea.x)} · Y {Math.round(cropArea.y)}</span>
                  <span>{Math.round(cropArea.width)} × {Math.round(cropArea.height)}</span>
                </>
              ) : (
                <span className="col-span-2">No crop selected</span>
              )}
            </div>
            {isCropActive && (
              <div className="mt-3 space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCrop}
                  disabled={isSaving}
                  className="w-full text-gray-500"
                >
                  <X />
                  Cancel crop
                  <kbd className="ml-auto rounded border border-gray-200 px-1.5 py-0.5 text-[10px] dark:border-gray-700">
                    Esc
                  </kbd>
                </Button>
                <Button
                  onClick={() => void saveImage()}
                  disabled={isSaving}
                  className="h-11 w-full bg-indigo-600 text-base font-semibold text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500 hover:bg-indigo-700 dark:text-white"
                >
                  {isSaving
                    ? <LoaderCircle className="animate-spin" />
                    : <Crop />}
                  {isSaving ? 'Saving crop…' : 'Save crop'}
                  {!isSaving && (
                    <kbd className="ml-auto rounded border border-white/40 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Enter
                    </kbd>
                  )}
                </Button>
                <p className="text-center text-[11px] leading-4 text-gray-400 dark:text-gray-500">
                  Saving replaces the current image with the selected area.
                </p>
              </div>
            )}
          </section>

          <div className="my-6 border-t border-gray-200 dark:border-gray-800" />

          <section>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Maximize2 className="size-4" />
              Resize
            </div>
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Width
                <Input
                  type="number"
                  min={1}
                  max={12000}
                  value={outputWidth}
                  onChange={(event) => changeWidth(Number(event.target.value))}
                  className="mt-1"
                />
              </label>
              <span className="pb-2 text-gray-400">×</span>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Height
                <Input
                  type="number"
                  min={1}
                  max={12000}
                  value={outputHeight}
                  onChange={(event) => changeHeight(Number(event.target.value))}
                  className="mt-1"
                />
              </label>
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={lockAspectRatio}
                onChange={(event) => setLockAspectRatio(event.target.checked)}
                className="size-4 rounded border-gray-300 text-indigo-600"
              />
              Keep aspect ratio
            </label>
          </section>

          <div className="my-6 border-t border-gray-200 dark:border-gray-800" />

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setAspectRatio(null)}
            disabled={isSaving}
          >
            <RotateCcw />
            Reset edits
          </Button>

          {saveError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {saveError}
            </p>
          )}
          {sourceMimeType === 'image/gif' && (
            <p className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <ImageIcon className="mt-0.5 size-4 shrink-0" />
              Animated GIF frames cannot be retained after editing. The result is a still image.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
