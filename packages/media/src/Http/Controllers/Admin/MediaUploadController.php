<?php

declare(strict_types=1);

namespace TerraSphere\Media\Http\Controllers\Admin;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use TerraSphere\Media\Models\MediaAsset;
use Throwable;

final class MediaUploadController
{
    public function __invoke(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'images' => ['required', 'array', 'min:1', 'max:20'],
            'images.*' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp,gif,avif',
                'max:10240',
            ],
        ]);

        $disk = 'local';
        $storedPaths = [];

        DB::beginTransaction();

        try {
            foreach ($validated['images'] as $image) {
                if (! $image instanceof UploadedFile) {
                    continue;
                }

                $uuid = (string) Str::uuid();
                $extension = strtolower($image->extension() ?: $image->getClientOriginalExtension());
                $path = $image->storeAs(
                    'media/'.now()->format('Y/m'),
                    "$uuid.$extension",
                    $disk,
                );

                if (! is_string($path)) {
                    throw new \RuntimeException('The image could not be stored.');
                }

                $storedPaths[] = $path;
                $dimensions = @getimagesize($image->getRealPath());
                $filename = basename(str_replace('\\', '/', $image->getClientOriginalName()));
                $filename = preg_replace('/[[:cntrl:]]/u', '', $filename) ?: "image.$extension";

                MediaAsset::query()->create([
                    'uuid' => $uuid,
                    'disk' => $disk,
                    'path' => $path,
                    'filename' => $filename,
                    'mime_type' => $image->getMimeType() ?: 'application/octet-stream',
                    'size' => $image->getSize(),
                    'width' => is_array($dimensions) ? $dimensions[0] : null,
                    'height' => is_array($dimensions) ? $dimensions[1] : null,
                    'uploaded_by' => $request->user()?->getAuthIdentifier(),
                ]);
            }

            DB::commit();
        } catch (Throwable $exception) {
            DB::rollBack();

            foreach ($storedPaths as $path) {
                Storage::disk($disk)->delete($path);
            }

            throw $exception;
        }

        return back()->with('success', count($storedPaths).' image(s) uploaded.');
    }
}
