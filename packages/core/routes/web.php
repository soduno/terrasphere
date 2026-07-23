<?php

declare(strict_types=1);

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Route;
use TerraSphere\Core\Http\Controllers\Admin\DashboardController;
use TerraSphere\Core\Http\Middleware\HandleAdminInertiaRequests;

Route::view('/', 'terrasphere::welcome')->name('terrasphere.home');

Route::middleware(['web', HandleAdminInertiaRequests::class])
    ->prefix('admin')
    ->name('terrasphere.admin.')
    ->group(function (): void {
        Route::get('/', DashboardController::class)->name('dashboard');
        Route::get('/content', fn (): Response => Inertia::render('Admin/Content'))
            ->name('content');
        Route::get('/settings', fn (): Response => Inertia::render('Admin/Settings'))
            ->name('settings');
        Route::get('/extensions', fn (): Response => Inertia::render('Admin/Extensions'))
            ->name('extensions');
        Route::get('/profile', fn (): Response => Inertia::render('Admin/Profile'))
            ->name('profile');
        Route::get('/editor/{id?}', fn (?string $id = null): Response => Inertia::render(
            'Admin/Editor',
            ['id' => $id],
        ))->name('editor');
        Route::get('/fields-builder', fn (): Response => Inertia::render('Admin/FieldsBuilder'))
            ->name('fields-builder');
        Route::get('/fields-editor/{id}', fn (string $id): Response => Inertia::render(
            'Admin/FieldsEditor',
            ['id' => $id],
        ))->name('fields-editor');
    });
