<?php

declare(strict_types=1);

namespace TerraSphere\Media\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use TerraSphere\Media\Models\MediaAsset;

final class MediaPickerController
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'images' => MediaAsset::query()
                ->latest()
                ->get()
                ->map(fn (MediaAsset $asset): array => [
                    'id' => (int) $asset->getKey(),
                    'url' => route('terrasphere.media.file', [
                        'asset' => $asset->uuid,
                        'filename' => $asset->filename,
                    ], false),
                    'name' => $asset->filename,
                    'width' => $asset->width,
                    'height' => $asset->height,
                    'size' => $asset->size,
                ]),
        ]);
    }
}
