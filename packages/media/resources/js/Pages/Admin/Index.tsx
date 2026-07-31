import { Link, router } from '@inertiajs/react';
import { api, ApiError } from '@adapter/api';
import {
  Check,
  Copy,
  CopyPlus,
  Ellipsis,
  ExternalLink,
  FileType2,
  ImageOff,
  LoaderCircle,
  Pencil,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@ui/alert-dialog';
import { Button } from '@ui/button';
import { Checkbox } from '@ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select';
import { DataTable, type DataTableRowState } from '@components/DataTable';
import {
  ImageEditor,
  exportMimeType,
  extensionForMimeType,
  mimeTypeForFormat,
  wholeImage,
  type ImageFormat,
} from '../../lib/imageEditor';

interface ImageUsagePage {
  id: number;
  title: string;
  href: string;
  sources: string[];
}

interface UsedImage {
  id: number | null;
  deleteUrl: string | null;
  convertUrl: string | null;
  duplicateUrl: string | null;
  editorUrl: string | null;
  url: string;
  name: string;
  host: string;
  mimeType: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  uploaded: boolean;
  usageCount: number;
  updatedAt: string | null;
  pages: ImageUsagePage[];
}

interface MediaProps {
  images: UsedImage[];
  formats: SupportedImageFormat[];
  summary: {
    images: number;
    uploaded: number;
    references: number;
    pages: number;
  };
}

interface SupportedImageFormat {
  value: ImageFormat;
  label: string;
  mimeType: string;
}

function formatFileSize(bytes: number | null) {
  if (bytes === null) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ImagePreview({ image }: { image: UsedImage }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
      {failed ? (
        <ImageOff className="size-5 text-gray-400" aria-label="Preview unavailable" />
      ) : (
        <img
          src={image.url}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      )}
    </div>
  );
}

export default function MediaIndex({ images, formats, summary }: MediaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingImageUrls, setDeletingImageUrls] =
    useState<Set<string>>(() => new Set());
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<UsedImage | null>(null);
  const [convertTarget, setConvertTarget] = useState<UsedImage | null>(null);
  const [convertFormat, setConvertFormat] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [duplicatingImageUrl, setDuplicatingImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = (incomingFiles: FileList | File[]) => {
    const files = Array.from(incomingFiles)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, 20);

    if (files.length === 0 || isUploading) {
      if (files.length === 0) setUploadError('Choose one or more image files.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);

    api.post(
      '/admin/media',
      { images: files },
      {
        inertia: true,
        forceFormData: true,
        preserveScroll: true,
        onProgress: (progress) => setUploadProgress(progress?.percentage ?? 0),
        onError: (errors) => {
          setUploadError(Object.values(errors)[0] ?? 'The images could not be uploaded.');
        },
        onFinish: () => {
          setIsUploading(false);
          setUploadProgress(0);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
      },
    );
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    uploadFiles(event.dataTransfer.files);
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) uploadFiles(event.target.files);
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    window.setTimeout(() => setCopiedUrl((current) => current === url ? null : current), 1800);
  };

  const deleteImages = (targets: UsedImage[]) => {
    const targetIds = targets.flatMap((image) =>
      image.id === null ? [] : [image.id]
    );
    const targetUrls = targets.map((image) => image.url);
    setDeleteError(null);
    setIsDeleting(true);
    setDeletingImageUrls(new Set(targetUrls));

    window.setTimeout(() => {
      const onError = (errors: Record<string, string>) => {
        setDeleteError(
          Object.values(errors)[0] ?? 'The images could not be deleted.',
        );
      };
      const onFinish = () => {
        setIsDeleting(false);
        setDeletingImageUrls(new Set());
      };

      if (targets.length === 1 && targets[0]?.deleteUrl) {
        api.delete(targets[0].deleteUrl, {
          inertia: true,
          preserveScroll: true,
          onError,
          onFinish,
        });
        return;
      }

      router.visit('/admin/media', {
        method: 'delete',
        data: { ids: targetIds },
        preserveScroll: true,
        onError,
        onFinish,
      });
    }, 450);
  };

  const handleDelete = (targets: UsedImage[]) => {
    deleteImages(targets);
  };

  const confirmSingleDelete = () => {
    if (!singleDeleteTarget) return;
    deleteImages([singleDeleteTarget]);
    setSingleDeleteTarget(null);
  };

  const openConverter = (target: UsedImage) => {
    const nextFormat = formats.find((format) => format.mimeType !== target.mimeType)
      ?? formats[0];

    setConvertTarget(target);
    setConvertFormat(nextFormat?.value ?? '');
    setConvertError(null);
  };

  const convertImage = async () => {
    if (!convertTarget?.convertUrl || !convertFormat || isConverting) return;

    setIsConverting(true);
    setConvertError(null);

    try {
      const source = new Image();
      source.decoding = 'async';
      source.src = `${convertTarget.url}?v=${Date.now()}`;
      await new Promise<void>((resolve, reject) => {
        source.onload = () => resolve();
        source.onerror = () => reject(new Error('The image could not be decoded.'));
      });

      const requestedMimeType = convertFormat === 'gif'
        ? 'image/webp'
        : exportMimeType(mimeTypeForFormat(convertFormat as ImageFormat));
      const editor = new ImageEditor(source);
      const blob = await editor.export({
        crop: wholeImage(source.naturalWidth, source.naturalHeight),
        width: source.naturalWidth,
        height: source.naturalHeight,
        mimeType: requestedMimeType,
        quality: requestedMimeType === 'image/jpeg' ? 0.92 : 0.98,
      });
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('format', convertFormat);
      formData.append(
        'image',
        new File(
          [blob],
          `${convertTarget.name}.${extensionForMimeType(blob.type)}`,
          { type: blob.type },
        ),
      );

      await api.post(convertTarget.convertUrl, formData);
      setConvertTarget(null);
      router.reload({
        only: ['images', 'summary'],
      });
    } catch (reason) {
      if (reason instanceof ApiError) {
        setConvertError(
          Object.values(reason.errors).flat()[0] ?? reason.message,
        );
      } else {
        setConvertError(
          reason instanceof Error ? reason.message : 'The image could not be converted.',
        );
      }
    } finally {
      setIsConverting(false);
    }
  };

  const duplicateImage = async (target: UsedImage) => {
    if (!target.duplicateUrl || duplicatingImageUrl !== null) return;

    setDuplicatingImageUrl(target.url);

    try {
      await api.post(target.duplicateUrl, {});
      router.reload({
        only: ['images', 'summary'],
      });
    } catch (reason) {
      setDeleteError(
        reason instanceof Error ? reason.message : 'The image could not be duplicated.',
      );
    } finally {
      setDuplicatingImageUrl(null);
    }
  };

  const deleteReferenceCount = singleDeleteTarget
    ? singleDeleteTarget.usageCount
    : 0;

  return (
    <div
      className="relative min-h-full"
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDragging(false);
        }
      }}
      onDrop={handleDrop}
    >
      <DataTable
        items={images}
        itemKey={(image) => image.url}
        searchPlaceholder="Search images, URLs, or pages..."
        searchFilter={(image, query) => {
          if (!query.trim()) return true;
          const q = query.trim().toLocaleLowerCase();
          return [
            image.name,
            image.url,
            image.host,
            ...image.pages.map((page) => page.title),
          ].some((value) => value.toLocaleLowerCase().includes(q));
        }}
        title="Media"
        description="Upload images and see everywhere they are used."
        selectable={(image) => image.id !== null && image.deleteUrl !== null}
        onDelete={handleDelete}
        deletingIds={deletingImageUrls}
        isDeleting={isDeleting}
        deleteError={deleteError}
        onClearDelete={() => setDeleteError(null)}
        deleteConfirmTitle={(targets) =>
          targets.length === 1
            ? `Delete ${targets[0]?.name}?`
            : `Delete ${targets.length} images?`
        }
        deleteConfirmDescription={(targets) => {
          const refCount = targets.reduce((total, img) => total + img.usageCount, 0);
          return `This permanently removes the selected uploaded ${
            targets.length === 1 ? 'file.' : 'files.'
          }${
            refCount > 0
              ? ` ${targets.length === 1
                  ? `It currently has ${refCount} ${refCount === 1 ? 'reference' : 'references'}`
                  : `Together they currently have ${refCount} references`
                } in your content, which will show broken images until replaced.`
              : ''
          }`;
        }}
        deleteConfirmAction={(targets) =>
          targets.some((image) => image.usageCount > 0)
            ? 'Delete anyway'
            : 'Delete'
        }
        renderRow={(image, state: DataTableRowState) => (
          <div className="grid gap-5 px-6 py-5 md:grid-cols-[20px_minmax(250px,1.2fr)_minmax(220px,1fr)_90px_110px_44px] md:items-center md:gap-6">
            <div className="flex items-center">
              <Checkbox
                aria-label={`Select ${image.name}`}
                checked={state.selected}
                disabled={!image.deleteUrl || isDeleting}
                onCheckedChange={() => state.toggle()}
              />
              <span className="ml-2 text-xs text-gray-500 md:hidden dark:text-gray-400">
                Select
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-4">
              <ImagePreview image={image} />
              <div className="min-w-0">
                {image.editorUrl ? (
                  <Link
                    href={image.editorUrl}
                    className="block truncate text-sm font-medium text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                  >
                    {image.name}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {image.name}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {[
                    image.host,
                    image.width && image.height ? `${image.width} × ${image.height}` : null,
                  ].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Open image"
                    aria-label={`Open ${image.name}`}
                    className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => void copyUrl(image.url)}
                    className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                    title="Copy image URL"
                    aria-label={`Copy URL for ${image.name}`}
                  >
                    {copiedUrl === image.url
                      ? <Check className="size-3.5 text-green-600" />
                      : <Copy className="size-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {image.pages.length > 0 ? image.pages.map((page) => (
                <div key={page.id} className="min-w-0">
                  <Link
                    href={page.href}
                    className="text-sm font-medium text-gray-800 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400"
                  >
                    {page.title}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                    {page.sources.join(', ')}
                  </p>
                </div>
              )) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">Not used yet</p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {image.usageCount} {image.usageCount === 1 ? 'reference' : 'references'}
              </p>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(image.size) ?? '\u2014'}
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {image.updatedAt
                ? new Intl.DateTimeFormat(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }).format(new Date(image.updatedAt))
                : '\u2014'}
            </p>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="flex size-9 items-center justify-center justify-self-start rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 md:justify-self-end dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  title="Image actions"
                  aria-label={`Actions for ${image.name}`}
                >
                  <Ellipsis className="size-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  disabled={!image.editorUrl}
                  onSelect={() => {
                    if (image.editorUrl) router.visit(image.editorUrl);
                  }}
                >
                  <Pencil />
                  Edit image
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!image.convertUrl || formats.length === 0}
                  onSelect={() => {
                    if (image.convertUrl) openConverter(image);
                  }}
                >
                  <FileType2 />
                  Convert image
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!image.duplicateUrl || duplicatingImageUrl !== null}
                  onSelect={() => void duplicateImage(image)}
                >
                  {duplicatingImageUrl === image.url
                    ? <LoaderCircle className="animate-spin" />
                    : <CopyPlus />}
                  Duplicate image
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={!image.deleteUrl}
                  onSelect={() => {
                    setDeleteError(null);
                    setSingleDeleteTarget(image);
                  }}
                >
                  <Trash2 />
                  Delete image
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        renderListHeader={
          <div className="hidden grid-cols-[20px_minmax(250px,1.2fr)_minmax(220px,1fr)_90px_110px_44px] gap-6 bg-gray-50/60 px-6 py-3 text-xs uppercase tracking-wider text-gray-500 md:grid dark:bg-gray-800/40 dark:text-gray-400">
            <span />
            <span>Image</span>
            <span>Used on</span>
            <span>Size</span>
            <span>Updated</span>
            <span className="sr-only">Actions</span>
          </div>
        }
      >
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'All images', value: summary.images },
            { label: 'Uploaded', value: summary.uploaded },
            { label: 'References', value: summary.references },
            { label: 'Pages using media', value: summary.pages },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800"
            >
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{item.value}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <div
            className={`relative flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10'
                : 'border-gray-200 bg-gray-50/70 hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-indigo-600 dark:hover:bg-indigo-500/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={handleFileSelection}
              className="sr-only"
              id="media-upload"
              disabled={isUploading}
            />

            <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:text-indigo-300 dark:ring-gray-700">
              {isUploading
                ? <LoaderCircle className="size-6 animate-spin" />
                : <UploadCloud className="size-6" />}
            </div>
            <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
              {isUploading
                ? `Uploading${uploadProgress > 0 ? ` \u00b7 ${uploadProgress}%` : '\u2026'}`
                : isDragging ? 'Drop images to upload' : 'Drop images here'}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              or{' '}
              <label
                htmlFor="media-upload"
                className="cursor-pointer font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                choose files
              </label>
              {' '}\u00b7 JPG, PNG, WebP, GIF or AVIF \u00b7 up to 10 MB each
            </p>

            {isUploading && (
              <div className="mt-4 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-[width]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            {uploadError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{uploadError}</p>
            )}
          </div>
        </div>
      </DataTable>

      <Dialog
        open={convertTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isConverting) {
            setConvertTarget(null);
            setConvertError(null);
          }
        }}
      >
        <DialogContent className="max-w-md dark:border-gray-800 dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Convert image</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Choose a new format for {convertTarget?.name}. Its dimensions and
              media URL will stay the same.
            </DialogDescription>
          </DialogHeader>

          {convertTarget && (
            <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
              <ImagePreview image={convertTarget} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {convertTarget.name}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Current format:{' '}
                  {formats.find((format) => format.mimeType === convertTarget.mimeType)?.label
                    ?? convertTarget.mimeType?.replace('image/', '').toUpperCase()
                    ?? 'Unknown'}
                </p>
              </div>
            </div>
          )}

          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Convert to
            <Select
              value={convertFormat}
              onValueChange={setConvertFormat}
              disabled={isConverting}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose a format" />
              </SelectTrigger>
              <SelectContent>
                {formats.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {(convertTarget?.mimeType === 'image/gif' || convertFormat === 'gif') && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              Animated GIF frames cannot be retained during conversion. The result
              will be a still image.
            </p>
          )}

          {convertError && (
            <p className="text-sm text-red-600 dark:text-red-400">{convertError}</p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isConverting}
              onClick={() => setConvertTarget(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={!convertFormat || isConverting}
              onClick={() => void convertImage()}
              className="bg-indigo-600 text-white hover:bg-indigo-700 dark:text-white"
            >
              {isConverting && <LoaderCircle className="animate-spin" />}
              {isConverting ? 'Converting…' : 'Convert image'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={singleDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setSingleDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {singleDeleteTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected uploaded file.
              {deleteReferenceCount > 0 && (
                <>
                  {' '}It currently has {deleteReferenceCount}{' '}
                  {deleteReferenceCount === 1 ? 'reference' : 'references'} in your
                  content, which will show broken images until replaced.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmSingleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              {deleteReferenceCount > 0 ? 'Delete anyway' : 'Delete image'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
