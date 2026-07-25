<?php

declare(strict_types=1);

namespace TerraSphere\Media\Http\Controllers\Admin;

use Inertia\Inertia;
use Inertia\Response;
use TerraSphere\Media\Support\UsedImageFinder;

final class MediaController
{
    public function __invoke(UsedImageFinder $images): Response
    {
        $items = $images->all();

        return Inertia::render('Media/Admin/Index', [
            'images' => $items,
            'summary' => [
                'images' => count($items),
                'uploaded' => count(array_filter(
                    $items,
                    fn (array $item): bool => $item['uploaded']
                )),
                'references' => array_sum(array_column($items, 'usageCount')),
                'pages' => count(array_unique(array_merge(
                    ...array_map(
                        fn (array $item): array => array_column($item['pages'], 'id'),
                        $items
                    )
                ))),
            ],
        ]);
    }
}
