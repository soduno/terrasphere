import { LoaderCircle } from 'lucide-react';
import type { EditorCanvasFeedbackProps } from '../../types/editor';

export function EditorCanvasFeedback({
  isUploadingImages,
  imageUploadError,
  showError,
  justDropped,
}: EditorCanvasFeedbackProps) {
  return (
    <>
      {isUploadingImages && (
        <div className="pointer-events-none absolute left-1/2 top-5 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full border border-indigo-200 bg-white/95 px-4 py-2 text-sm font-medium text-indigo-700 shadow-lg backdrop-blur dark:border-indigo-800 dark:bg-gray-900/95 dark:text-indigo-300">
          <LoaderCircle className="size-4 animate-spin" />
          Uploading images…
        </div>
      )}

      {imageUploadError && !isUploadingImages && (
        <div className="absolute right-5 top-5 z-[100] max-w-sm rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {imageUploadError}
        </div>
      )}

      {showError && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
          <div className="animate-pulse rounded-full bg-red-500 p-8 shadow-2xl shadow-red-500/50">
            <svg
              className="size-16 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>
      )}

      {justDropped && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
          <div className="animate-in zoom-in-95 fade-out rounded-full bg-green-500 p-8 shadow-2xl shadow-green-500/50 duration-500">
            <svg
              className="size-16 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      )}
    </>
  );
}
