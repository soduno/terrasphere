<?php

declare(strict_types=1);

namespace TerraSphere\Core\Http\Middleware;

use Inertia\Middleware;

final class HandleAdminInertiaRequests extends Middleware
{
    protected $rootView = 'terrasphere::admin';
}
