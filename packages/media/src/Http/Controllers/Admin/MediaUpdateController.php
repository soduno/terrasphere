<?php

declare(strict_types=1);

namespace TerraSphere\Media\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use RuntimeException;
use TerraSphere\Media\Models\MediaAsset;
use TerraSphere\Media\Support\ImageEncoder;
use Throwable;

final class MediaUpdateController
{
    public function __invoke(
        Request $request,
        MediaAsset $asset,
        ImageEncoder $encoder,
    ): JsonResponse {
        $formats = ImageEncoder::supportedFormats();
        $validated = $request->validate([
            'image' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:65536',
            ],
            'format' => [
                'required',
                'string',
                Rule::in(array_column($formats, 'value')),
            ],
        ]);
        $image = $validated['image'];
        $format = $validated['format'];

        if (! $image instanceof UploadedFile || ! is_string($format)) {
            throw new RuntimeException('The edited image could not be read.');
        }

        $dimensions = @getimagesize($image->getRealPath());
        if (! is_array($dimensions)) {
            throw new RuntimeException('The edited image dimensions could not be read.');
        }

        $disk = Storage::disk($asset->disk);
        $backupPath = "media/.backups/{$asset->uuid}-".Str::random(12);
        if (! $disk->copy($asset->path, $backupPath)) {
            throw new RuntimeException('The original image could not be backed up.');
        }

        $mimeType = ImageEncoder::mimeType($format);

        try {
            if ($image->getMimeType() === $mimeType) {
                $stream = fopen($image->getRealPath(), 'rb');
                if ($stream === false) {
                    throw new RuntimeException('The edited image could not be read.');
                }

                try {
                    $stored = $disk->put($asset->path, $stream);
                } finally {
                    fclose($stream);
                }

                $size = $image->getSize();
            } else {
                $contents = file_get_contents($image->getRealPath());
                if (! is_string($contents)) {
                    throw new RuntimeException('The edited image could not be read.');
                }

                $contents = $encoder->encode($contents, $format);
                $stored = $disk->put($asset->path, $contents);
                $size = strlen($contents);
            }

            if (! $stored) {
                throw new RuntimeException('The edited image could not be stored.');
            }

            $asset->forceFill([
                'mime_type' => $mimeType,
                'size' => $size,
                'width' => $dimensions[0],
                'height' => $dimensions[1],
            ])->save();

            $disk->delete("media/.thumbnails/{$asset->uuid}.webp");
            $disk->delete($backupPath);
        } catch (Throwable $exception) {
            $disk->delete($asset->path);
            $disk->move($backupPath, $asset->path);

            throw $exception;
        }

        return response()->json([
            'image' => [
                'url' => route('terrasphere.media.file', [
                    'asset' => $asset->uuid,
                    'filename' => $asset->filename,
                ], false),
                'mimeType' => $asset->mime_type,
                'size' => $asset->size,
                'width' => $asset->width,
                'height' => $asset->height,
            ],
        ]);
    }
}
