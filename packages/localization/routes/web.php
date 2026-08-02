<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use TerraSphere\Core\Http\Middleware\HandleAdminInertiaRequests;
use TerraSphere\Core\Http\Middleware\RequireAdminAuthentication;
use TerraSphere\Localization\Http\Controllers\Admin\LanguageController;

Route::middleware([
    'web',
    HandleAdminInertiaRequests::class,
    RequireAdminAuthentication::class,
])
    ->prefix('admin/localization')
    ->name('terrasphere.admin.localization.')
    ->group(function (): void {
        Route::get('/', [LanguageController::class, 'index'])->name('index');
        Route::post('/languages', [LanguageController::class, 'store'])->name('store');
        Route::put('/languages/{language}', [LanguageController::class, 'update'])->name('update');
        Route::delete('/languages', [LanguageController::class, 'destroyMany'])->name('destroy-many');
        Route::delete('/languages/{language}', [LanguageController::class, 'destroy'])->name('destroy');
    });
