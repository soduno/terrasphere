<?php

declare(strict_types=1);

namespace TerraSphere\Media\Http\Controllers\Admin;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use TerraSphere\Media\Models\MediaAsset;

final class MediaBulkDeleteController
{
    public function __invoke(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => [
                'required',
                'integer',
                'distinct',
                'exists:media_assets,id',
            ],
        ]);
        $assetIds = $validated['ids'];

        MediaAsset::query()
            ->whereKey($assetIds)
            ->get()
            ->each(function (MediaAsset $asset): void {
                $disk = Storage::disk($asset->disk);

                if (
                    $disk->exists($asset->path)
                    && ! $disk->delete($asset->path)
                ) {
                    throw new RuntimeException(
                        "The media file {$asset->filename} could not be deleted."
                    );
                }

                $disk->delete("media/.thumbnails/{$asset->uuid}.webp");
                $asset->delete();
            });

        $count = count($assetIds);

        return redirect()
            ->route('terrasphere.admin.media.index')
            ->with(
                'success',
                $count === 1 ? 'Image deleted.' : "{$count} images deleted."
            );
    }
}
