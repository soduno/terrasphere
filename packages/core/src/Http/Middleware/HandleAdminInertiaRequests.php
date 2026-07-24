<?php

declare(strict_types=1);

namespace TerraSphere\Core\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

final class HandleAdminInertiaRequests extends Middleware
{
    protected $rootView = 'terrasphere::admin';

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user()?->only(['uuid', 'username', 'email']),
            ],
        ];
    }
}
