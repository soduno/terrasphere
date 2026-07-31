export interface ImageCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface ImageExportOptions extends ImageSize {
  crop: ImageCrop;
  mimeType?: string;
  quality?: number;
}

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'avif';

const editableMimeTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function wholeImage(width: number, height: number): ImageCrop {
  return { x: 0, y: 0, width, height };
}

export function cropToAspect(
  source: ImageSize,
  ratio: number,
): ImageCrop {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    throw new Error('The crop ratio must be greater than zero.');
  }

  let width = source.width;
  let height = width / ratio;
  if (height > source.height) {
    height = source.height;
    width = height * ratio;
  }

  return {
    x: Math.round((source.width - width) / 2),
    y: Math.round((source.height - height) / 2),
    width: Math.round(width),
    height: Math.round(height),
  };
}

export function sizeFromWidth(crop: ImageCrop, width: number): ImageSize {
  return {
    width,
    height: Math.max(1, Math.round(width * crop.height / crop.width)),
  };
}

export function sizeFromHeight(crop: ImageCrop, height: number): ImageSize {
  return {
    width: Math.max(1, Math.round(height * crop.width / crop.height)),
    height,
  };
}

export function exportMimeType(sourceMimeType: string) {
  return editableMimeTypes.some((mimeType) => mimeType === sourceMimeType)
    ? sourceMimeType
    : 'image/png';
}

export function extensionForMimeType(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/webp') return 'webp';
  return 'png';
}

export function mimeTypeForFormat(format: ImageFormat) {
  const mimeTypes: Record<ImageFormat, string> = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    avif: 'image/avif',
  };

  return mimeTypes[format];
}

export function formatForMimeType(mimeType: string): ImageFormat | null {
  const formats: Record<string, ImageFormat> = {
    'image/jpeg': 'jpeg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
  };

  return formats[mimeType] ?? null;
}

/**
 * Small dependency-free image editing engine built on the browser Canvas API.
 *
 * The class deliberately has no React or TerraSphere dependencies, so it can
 * also be used by pickers, fields, or extensions.
 */
export class ImageEditor {
  constructor(private readonly source: CanvasImageSource) {}

  async export(options: ImageExportOptions): Promise<Blob> {
    const width = Math.round(options.width);
    const height = Math.round(options.height);
    const crop = {
      x: Math.round(options.crop.x),
      y: Math.round(options.crop.y),
      width: Math.round(options.crop.width),
      height: Math.round(options.crop.height),
    };

    if (
      width < 1
      || height < 1
      || crop.width < 1
      || crop.height < 1
    ) {
      throw new Error('Image dimensions must be greater than zero.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Your browser could not prepare the image editor.');
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    if (options.mimeType === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(
      this.source,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      width,
      height,
    );

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result
          ? resolve(result)
          : reject(new Error('The edited image could not be encoded.')),
        options.mimeType ?? 'image/png',
        options.quality,
      );
    });
  }
}
