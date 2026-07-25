import { Link, router } from '@inertiajs/react';
import {
  Check,
  Copy,
  ExternalLink,
  FileImage,
  ImageOff,
  LoaderCircle,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@ui/alert-dialog';
import { Button } from '@ui/button';
import { Input } from '@ui/input';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UsedImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

  const filteredImages = useMemo(
    () => images.filter((image) => {
      if (!normalizedQuery) return true;

      return [
        image.name,
        image.url,
        image.host,
        ...image.pages.map((page) => page.title),
      ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    }),
    [images, normalizedQuery],
  );

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

    router.post(
      '/admin/media',
      { images: files },
      {
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

  const deleteImage = () => {
    if (!deleteTarget?.deleteUrl || isDeleting) return;

    const image = deleteTarget;
    setDeleteError(null);
    setIsDeleting(true);
    setDeletingImageUrl(image.url);
    setDeleteTarget(null);

    window.setTimeout(() => {
      router.delete(image.deleteUrl!, {
        preserveScroll: true,
        onError: (errors) => {
          setDeleteTarget(image);
          setDeleteError(Object.values(errors)[0] ?? 'The image could not be deleted.');
        },
        onFinish: () => {
          setIsDeleting(false);
          setDeletingImageUrl(null);
        },
      });
    }, 450);
  };

  return (
    <div
      className="relative min-h-full p-10"
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
      <div className="mb-8">
        <h1 className="mb-2 text-gray-900 dark:text-white">Media</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Upload images and see everywhere they are used.
        </p>
      </div>

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

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
        <div className="p-6 pb-0">
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
                ? `Uploading${uploadProgress > 0 ? ` · ${uploadProgress}%` : '…'}`
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
              {' '}· JPG, PNG, WebP, GIF or AVIF · up to 10 MB each
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

        <div className="border-b border-gray-100 p-6 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search images, URLs, or pages..."
              aria-label="Search media"
              className="h-12 rounded-xl border-gray-200 pl-12 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {filteredImages.length > 0 ? (
          <>
            <div className="hidden grid-cols-[minmax(280px,1.2fr)_minmax(260px,1fr)_110px_44px] gap-6 border-b border-gray-100 bg-gray-50/60 px-6 py-3 text-xs uppercase tracking-wider text-gray-500 md:grid dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400">
              <span>Image</span>
              <span>Used on</span>
              <span>Updated</span>
              <span className="sr-only">Actions</span>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredImages.map((image) => (
                <li
                  key={image.url}
                  className={`grid gap-5 px-6 py-5 transition-[background-color,opacity] duration-200 md:grid-cols-[minmax(280px,1.2fr)_minmax(260px,1fr)_110px_44px] md:items-center md:gap-6 ${
                    deletingImageUrl === image.url
                      ? 'animate-pulse bg-red-100/80 opacity-40 dark:bg-red-950/60'
                      : 'hover:bg-gray-50/70 dark:hover:bg-gray-800/30'
                  }`}
                >
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
                      : '—'}
                  </p>

                  <button
                    type="button"
                    disabled={!image.deleteUrl || isDeleting}
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteTarget(image);
                    }}
                    className="flex size-9 items-center justify-center justify-self-start rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 md:justify-self-end dark:hover:bg-red-950/40 dark:hover:text-red-400 dark:disabled:hover:bg-transparent dark:disabled:hover:text-gray-400"
                    title={image.deleteUrl ? 'Delete image' : 'Only uploaded images can be deleted'}
                    aria-label={`Delete ${image.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-center px-6 py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300">
              <FileImage className="size-6" />
            </div>
            <h2 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
              {images.length === 0 ? 'No images yet' : 'No matching images'}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
              {images.length === 0
                ? 'Drop images above to start your media library.'
                : 'Try another image name, URL, or page title.'}
            </p>
          </div>
        )}
      </section>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl border-gray-200 dark:border-gray-700 dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">
              Delete {deleteTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-6 text-gray-500 dark:text-gray-400">
              This permanently removes the uploaded file.
              {deleteTarget && deleteTarget.usageCount > 0 && (
                <>
                  {' '}It currently has {deleteTarget.usageCount}{' '}
                  {deleteTarget.usageCount === 1 ? 'reference' : 'references'} in your content,
                  which will show a broken image until replaced.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={deleteImage}
            >
              {isDeleting
                ? <LoaderCircle className="size-4 animate-spin" />
                : <Trash2 className="size-4" />}
              {isDeleting ? 'Deleting…' : 'Delete image'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
