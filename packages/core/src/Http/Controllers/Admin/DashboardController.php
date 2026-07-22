<?php

declare(strict_types=1);

namespace TerraSphere\Core\Http\Controllers\Admin;

use Inertia\Inertia;
use Inertia\Response;

final class DashboardController
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'cms' => [
                'name' => 'TerraSphere',
                'version' => '0.1.0',
            ],
        ]);
    }
}
