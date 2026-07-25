<?php

declare(strict_types=1);

namespace TerraSphere\Media\Http\Controllers\Admin;

use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use TerraSphere\Media\Models\MediaAsset;

final class MediaDeleteController
{
    public function __invoke(MediaAsset $asset): RedirectResponse
    {
        $disk = Storage::disk($asset->disk);

        if ($disk->exists($asset->path) && ! $disk->delete($asset->path)) {
            throw new RuntimeException('The media file could not be deleted.');
        }

        $asset->delete();

        return back()->with('success', 'Image deleted.');
    }
}
