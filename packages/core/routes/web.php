<?php

declare(strict_types=1);

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Route;
use TerraSphere\Core\Http\Controllers\Admin\AuthenticationController;
use TerraSphere\Core\Http\Controllers\Admin\DashboardController;
use TerraSphere\Core\Http\Controllers\Admin\PageController;
use TerraSphere\Core\Http\Controllers\Admin\UserSettingController;
use TerraSphere\Core\Http\Middleware\HandleAdminInertiaRequests;
use TerraSphere\Core\Http\Middleware\RequireAdminAuthentication;

Route::view('/', 'terrasphere::welcome')->name('terrasphere.home');

Route::middleware(['web', HandleAdminInertiaRequests::class])
    ->prefix('admin')
    ->name('terrasphere.admin.')
    ->group(function (): void {
        Route::get('/login', [AuthenticationController::class, 'create'])->name('login');
        Route::post('/login', [AuthenticationController::class, 'store'])->name('login.store');

        Route::middleware(RequireAdminAuthentication::class)->group(function (): void {
            Route::post('/logout', [AuthenticationController::class, 'destroy'])->name('logout');
            Route::get('/', DashboardController::class)->name('dashboard');
            Route::get('/content', [PageController::class, 'index'])->name('content');
            Route::post('/pages', [PageController::class, 'store'])->name('pages.store');
            Route::get('/settings', fn (): Response => Inertia::render('Admin/Settings'))
                ->name('settings');
            Route::get('/extensions', fn (): Response => Inertia::render('Admin/Extensions'))
                ->name('extensions');
            Route::get('/profile', fn (): Response => Inertia::render('Admin/Profile'))
                ->name('profile');
            Route::get('/editor/{page}', [PageController::class, 'editWysiwyg'])->name('editor');
            Route::put('/pages/{page}/wysiwyg', [PageController::class, 'saveWysiwyg'])
                ->name('pages.wysiwyg.update');
            Route::put(
                '/user-settings/editor/property-order',
                [UserSettingController::class, 'updateEditorPropertyOrder']
            )->name('user-settings.editor.property-order.update');
            Route::get('/fields-builder/{page}', [PageController::class, 'editFieldSchema'])
                ->name('fields-builder');
            Route::put('/pages/{page}/field-schema', [PageController::class, 'saveFieldSchema'])
                ->name('pages.field-schema.update');
            Route::get('/fields-editor/{page}', [PageController::class, 'editFieldValues'])
                ->name('fields-editor');
            Route::put('/pages/{page}/field-values', [PageController::class, 'saveFieldValues'])
                ->name('pages.field-values.update');
        });
    });
