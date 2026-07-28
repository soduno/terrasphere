import { Link, router } from '@inertiajs/react';
import { api } from '@adapter/api';
import {
  Check,
  Copy,
  ExternalLink,
  ImageOff,
  LoaderCircle,
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
import { Checkbox } from '@ui/checkbox';
import { DataTable, type DataTableRowState } from '@components/DataTable';

interface ImageUsagePage {
  id: number;
  title: string;
  href: string;
  sources: string[];
}

interface UsedImage {
  id: number | null;
  deleteUrl: string | null;
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
  summary: {
    images: number;
    uploaded: number;
    references: number;
    pages: number;
  };
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

export default function MediaIndex({ images, summary }: MediaProps) {
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
        renderRow={(image, state: DataTableRowState) => (
          <div className="grid gap-5 px-6 py-5 md:grid-cols-[20px_minmax(280px,1.2fr)_minmax(260px,1fr)_110px_44px] md:items-center md:gap-6">
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
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {image.name}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {[
                    image.host,
                    image.width && image.height ? `${image.width} × ${image.height}` : null,
                    formatFileSize(image.size),
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
              {image.updatedAt
                ? new Intl.DateTimeFormat(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }).format(new Date(image.updatedAt))
                : '\u2014'}
            </p>

            <button
              type="button"
              disabled={!image.deleteUrl || isDeleting}
              onClick={() => {
                setDeleteError(null);
                setSingleDeleteTarget(image);
              }}
              className="flex size-9 items-center justify-center justify-self-start rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 md:justify-self-end dark:hover:bg-red-950/40 dark:hover:text-red-400 dark:disabled:hover:bg-transparent dark:disabled:hover:text-gray-400"
              title={image.deleteUrl ? 'Delete image' : 'Only uploaded images can be deleted'}
              aria-label={`Delete ${image.name}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
        renderListHeader={
          <div className="hidden grid-cols-[20px_minmax(280px,1.2fr)_minmax(260px,1fr)_110px_44px] gap-6 bg-gray-50/60 px-6 py-3 text-xs uppercase tracking-wider text-gray-500 md:grid dark:bg-gray-800/40 dark:text-gray-400">
            <span />
            <span>Image</span>
            <span>Used on</span>
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
              Delete image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
