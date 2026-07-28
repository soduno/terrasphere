<?php

declare(strict_types=1);

namespace TerraSphere\Core\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use TerraSphere\Core\Admin\AdminNavigation;

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
            'adminNavigation' => fn (): array => app(AdminNavigation::class)->all(),
            'success' => fn () => $request->session()->get('success'),
        ];
    }
}
