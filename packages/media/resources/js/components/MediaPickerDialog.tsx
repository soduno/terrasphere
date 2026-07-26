import { useEffect, useMemo, useState } from 'react';
import { Check, FileImage, ImageOff, LoaderCircle, Search } from 'lucide-react';
import { api } from '@adapter/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@ui/dialog';
import { Input } from '@ui/input';

interface LibraryImage {
  id: number;
  url: string;
  name: string;
  width: number | null;
  height: number | null;
  size: number;
}

interface MediaPickerDialogProps {
  open: boolean;
  selectedUrl?: string;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

function PickerImage({
  image,
  selected,
  onSelect,
}: {
  image: LibraryImage;
  selected: boolean;
  onSelect: () => void;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group overflow-hidden rounded-xl border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        selected
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 dark:border-indigo-400'
          : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm dark:border-gray-700 dark:hover:border-indigo-600'
      }`}
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800">
        {failed ? (
          <ImageOff className="size-6 text-gray-400" />
        ) : (
          <img
            src={image.url}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        )}
        {selected && (
          <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
            <Check className="size-3.5" />
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{image.name}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {image.width && image.height ? `${image.width} × ${image.height}` : 'Image'}
        </p>
      </div>
    </button>
  );
}

export function MediaPickerDialog({
  open,
  selectedUrl,
  onOpenChange,
  onSelect,
}: MediaPickerDialogProps) {
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    api.get<{ images: LibraryImage[] }>('/admin/media-picker', {
      signal: controller.signal,
    })
      .then((data) => setImages(data.images))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : 'Unable to load the media library.');
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [open]);

  const filteredImages = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return images;

    return images.filter((image) => image.name.toLocaleLowerCase().includes(query));
  }, [images, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-gray-200 p-0 dark:border-gray-700 dark:bg-gray-900">
        <DialogHeader className="border-b border-gray-100 p-6 dark:border-gray-800">
          <DialogTitle className="text-gray-900 dark:text-white">Choose from Media</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Select an uploaded image for your content.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-gray-100 p-4 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search images..."
              aria-label="Search media library"
              className="h-10 rounded-xl border-gray-200 pl-10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="min-h-72 flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <LoaderCircle className="size-6 animate-spin text-indigo-500" />
            </div>
          ) : error ? (
            <div className="flex h-64 items-center justify-center text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : filteredImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {filteredImages.map((image) => (
                <PickerImage
                  key={image.id}
                  image={image}
                  selected={selectedUrl === image.url}
                  onSelect={() => {
                    onSelect(image.url);
                    onOpenChange(false);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300">
                <FileImage className="size-5" />
              </div>
              <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">
                {images.length === 0 ? 'No uploaded images yet' : 'No matching images'}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {images.length === 0
                  ? 'Upload images from the Media page first.'
                  : 'Try another search term.'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
