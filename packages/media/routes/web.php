<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use TerraSphere\Core\Http\Middleware\HandleAdminInertiaRequests;
use TerraSphere\Core\Http\Middleware\RequireAdminAuthentication;
use TerraSphere\Media\Http\Controllers\Admin\MediaController;
use TerraSphere\Media\Http\Controllers\Admin\MediaDeleteController;
use TerraSphere\Media\Http\Controllers\Admin\MediaUploadController;
use TerraSphere\Media\Http\Controllers\MediaFileController;

Route::middleware('web')
    ->get('/media/{asset}/{filename?}', MediaFileController::class)
    ->name('terrasphere.media.file');

Route::middleware([
    'web',
    HandleAdminInertiaRequests::class,
    RequireAdminAuthentication::class,
])
    ->prefix('admin')
    ->name('terrasphere.admin.media.')
    ->group(function (): void {
        Route::get('/media', MediaController::class)->name('index');
        Route::post('/media', MediaUploadController::class)->name('store');
        Route::delete('/media/{asset}', MediaDeleteController::class)->name('destroy');
    });
