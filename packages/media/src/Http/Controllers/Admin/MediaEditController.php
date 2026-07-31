<?php

declare(strict_types=1);

namespace TerraSphere\Media\Http\Controllers\Admin;

use Inertia\Inertia;
use Inertia\Response;
use TerraSphere\Media\Models\MediaAsset;
use TerraSphere\Media\Support\ImageEncoder;

final class MediaEditController
{
    public function __invoke(MediaAsset $asset): Response
    {
        return Inertia::render('Media/Admin/Edit', [
            'image' => [
                'uuid' => $asset->uuid,
                'name' => $asset->displayName(),
                'url' => route('terrasphere.media.file', [
                    'asset' => $asset->uuid,
                    'filename' => $asset->filename,
                ], false),
                'saveUrl' => route(
                    'terrasphere.admin.media.update',
                    ['asset' => $asset->uuid],
                    false,
                ),
                'renameUrl' => route(
                    'terrasphere.admin.media.rename',
                    ['asset' => $asset->uuid],
                    false,
                ),
                'mimeType' => $asset->mime_type,
                'size' => $asset->size,
                'width' => $asset->width,
                'height' => $asset->height,
            ],
            'formats' => ImageEncoder::supportedFormats(),
        ]);
    }
}
