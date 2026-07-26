import { useRef, useState } from 'react';
import { api, ApiError } from '@adapter/api';
import type { MediaUploadResponse } from '../../types/editor';

const MAX_IMAGE_COUNT = 20;

export function useEditorImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadInProgressRef = useRef(false);

  const upload = async (incomingFiles: File[]): Promise<string[] | null> => {
    const files = incomingFiles
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, MAX_IMAGE_COUNT);

    if (files.length === 0 || uploadInProgressRef.current) return null;

    uploadInProgressRef.current = true;
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('images[]', file));
      const response = await api.post<MediaUploadResponse>(
        '/admin/media',
        formData,
      );
      return response.images.map((image) => image.url);
    } catch (reason) {
      const validationError = reason instanceof ApiError
        ? Object.values(reason.errors).flat()[0]
        : undefined;
      setError(
        validationError
        ?? (reason instanceof Error
          ? reason.message
          : 'The images could not be uploaded.'),
      );
      return null;
    } finally {
      uploadInProgressRef.current = false;
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    error,
    upload,
  };
}
