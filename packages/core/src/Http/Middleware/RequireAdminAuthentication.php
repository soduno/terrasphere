<?php

declare(strict_types=1);

namespace TerraSphere\Core\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RequireAdminAuthentication
{
    public function handle(Request $request, Closure $next): Response|RedirectResponse
    {
        if (! $request->user()) {
            return redirect()->guest(route('terrasphere.admin.login'));
        }

        if ($request->user()->status !== 'active') {
            auth()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()
                ->route('terrasphere.admin.login')
                ->withErrors(['login' => 'This account is not active.']);
        }

        return $next($request);
    }
}
