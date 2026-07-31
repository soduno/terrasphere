<?php

declare(strict_types=1);

namespace TerraSphere\Media\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use TerraSphere\Media\Models\MediaAsset;

final class MediaRenameController
{
    public function __invoke(Request $request, MediaAsset $asset): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);
        $name = trim($validated['name']);

        if (
            $name === ''
            || preg_match('/[[:cntrl:]\/\\\\]/u', $name) === 1
        ) {
            throw ValidationException::withMessages([
                'name' => 'The image name contains invalid characters.',
            ]);
        }

        $asset->forceFill(['display_name' => $name])->save();

        return response()->json([
            'image' => [
                'name' => $asset->displayName(),
            ],
        ]);
    }
}
