<?php

declare(strict_types=1);

namespace TerraSphere\Core\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use TerraSphere\Core\Models\Setting;

final class SettingsController
{
    public function edit(Request $request): Response
    {
        return Inertia::render('Admin/Settings', [
            'settings' => $this->loadSettings(),
        ]);
    }

    public function update(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'site_name' => ['nullable', 'string', 'max:255'],
            'site_url' => ['nullable', 'string', 'max:255'],
            'site_description' => ['nullable', 'string', 'max:1000'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:1000'],
            'enable_seo' => ['boolean'],
            'enable_caching' => ['boolean'],
            'enable_image_optimization' => ['boolean'],
            'enable_lazy_loading' => ['boolean'],
        ]);

        $keys = [
            'site_name',
            'site_url',
            'site_description',
            'meta_title',
            'meta_description',
            'enable_seo',
            'enable_caching',
            'enable_image_optimization',
            'enable_lazy_loading',
        ];

        foreach ($keys as $key) {
            if ($request->has($key)) {
                Setting::set($key, $validated[$key] ?? null);
            }
        }

        if ($request->wantsJson()) {
            return response()->json($this->loadSettings());
        }

        return back()->with('success', 'Settings updated successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function loadSettings(): array
    {
        return [
            'site_name' => Setting::get('site_name') ?? 'ContentFlow CMS',
            'site_url' => Setting::get('site_url') ?? 'https://example.com',
            'site_description' => Setting::get('site_description') ?? 'A modern content management system',
            'meta_title' => Setting::get('meta_title') ?? 'ContentFlow - Modern CMS',
            'meta_description' => Setting::get('meta_description') ?? 'Build beautiful websites with our modern CMS',
            'enable_seo' => (bool) (Setting::get('enable_seo') ?? true),
            'enable_caching' => (bool) (Setting::get('enable_caching') ?? true),
            'enable_image_optimization' => (bool) (Setting::get('enable_image_optimization') ?? true),
            'enable_lazy_loading' => (bool) (Setting::get('enable_lazy_loading') ?? true),
        ];
    }
}
