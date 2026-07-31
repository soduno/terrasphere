<?php

declare(strict_types=1);

namespace TerraSphere\Media\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use TerraSphere\Media\Models\MediaAsset;
use Throwable;

final class MediaDuplicateController
{
    public function __invoke(Request $request, MediaAsset $asset): JsonResponse
    {
        $disk = Storage::disk($asset->disk);
        $uuid = (string) Str::uuid();
        $directory = dirname($asset->path);
        $extension = pathinfo($asset->path, PATHINFO_EXTENSION);
        $path = $directory.'/'.$uuid.($extension !== '' ? ".$extension" : '');

        if (! $disk->copy($asset->path, $path)) {
            throw new RuntimeException('The image could not be duplicated.');
        }

        try {
            $duplicate = MediaAsset::query()->create([
                'uuid' => $uuid,
                'disk' => $asset->disk,
                'path' => $path,
                'filename' => $this->duplicateFilename($asset->filename),
                'display_name' => $this->duplicateFilename($asset->displayName()),
                'mime_type' => $asset->mime_type,
                'size' => $asset->size,
                'width' => $asset->width,
                'height' => $asset->height,
                'uploaded_by' => $request->user()?->getAuthIdentifier(),
            ]);
        } catch (Throwable $exception) {
            $disk->delete($path);

            throw $exception;
        }

        return response()->json([
            'image' => [
                'uuid' => $duplicate->uuid,
                'name' => $duplicate->displayName(),
                'url' => route('terrasphere.media.file', [
                    'asset' => $duplicate->uuid,
                    'filename' => $duplicate->filename,
                ], false),
            ],
        ], 201);
    }

    private function duplicateFilename(string $filename): string
    {
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $name = pathinfo($filename, PATHINFO_FILENAME);

        return $name.'-copy'.($extension !== '' ? ".$extension" : '');
    }
}
