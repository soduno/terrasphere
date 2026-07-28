<?php

declare(strict_types=1);

namespace TerraSphere\Media\Http\Controllers;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use TerraSphere\Media\Models\MediaAsset;
use Throwable;

final class MediaThumbnailController
{
    private const MAX_SIZE = 480;

    public function __invoke(MediaAsset $asset): StreamedResponse|Response
    {
        $disk = Storage::disk($asset->disk);
        abort_unless($disk->exists($asset->path), 404);

        $thumbnailPath = "media/.thumbnails/{$asset->uuid}.webp";

        if (! $disk->exists($thumbnailPath)) {
            $this->createThumbnail($disk, $asset, $thumbnailPath);
        }

        if (! $disk->exists($thumbnailPath)) {
            return $disk->response($asset->path, $asset->filename, [
                'Cache-Control' => 'public, max-age=31536000, immutable',
                'Content-Type' => $asset->mime_type,
            ]);
        }

        return $disk->response($thumbnailPath, "{$asset->uuid}.webp", [
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'Content-Type' => 'image/webp',
        ]);
    }

    private function createThumbnail(
        Filesystem $disk,
        MediaAsset $asset,
        string $thumbnailPath,
    ): void {
        if (
            ! function_exists('imagecreatefromstring')
            || ! function_exists('imagewebp')
        ) {
            return;
        }

        try {
            $contents = $disk->get($asset->path);
            $source = @imagecreatefromstring($contents);

            if ($source === false) {
                return;
            }

            $sourceWidth = imagesx($source);
            $sourceHeight = imagesy($source);
            $scale = min(
                1,
                self::MAX_SIZE / max($sourceWidth, $sourceHeight),
            );
            $width = max(1, (int) round($sourceWidth * $scale));
            $height = max(1, (int) round($sourceHeight * $scale));
            $thumbnail = imagecreatetruecolor($width, $height);

            imagealphablending($thumbnail, false);
            imagesavealpha($thumbnail, true);
            imagefill(
                $thumbnail,
                0,
                0,
                imagecolorallocatealpha($thumbnail, 0, 0, 0, 127),
            );
            imagecopyresampled(
                $thumbnail,
                $source,
                0,
                0,
                0,
                0,
                $width,
                $height,
                $sourceWidth,
                $sourceHeight,
            );

            ob_start();
            $didEncode = imagewebp($thumbnail, null, 78);
            $encoded = ob_get_clean();

            imagedestroy($thumbnail);
            imagedestroy($source);

            if ($didEncode && is_string($encoded)) {
                $disk->put($thumbnailPath, $encoded);
            }
        } catch (Throwable $exception) {
            if (ob_get_level() > 0) {
                ob_end_clean();
            }

            report($exception);
        }
    }
}
