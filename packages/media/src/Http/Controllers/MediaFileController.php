<?php

declare(strict_types=1);

namespace TerraSphere\Media\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use TerraSphere\Media\Models\MediaAsset;

final class MediaFileController
{
    public function __invoke(MediaAsset $asset): StreamedResponse|Response
    {
        $disk = Storage::disk($asset->disk);
        abort_unless($disk->exists($asset->path), 404);

        return $disk->response($asset->path, $asset->filename, [
            'Cache-Control' => 'public, max-age=0, must-revalidate',
            'Content-Type' => $asset->mime_type,
        ]);
    }
}
