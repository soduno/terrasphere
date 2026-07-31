<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use TerraSphere\Core\Http\Middleware\HandleAdminInertiaRequests;
use TerraSphere\Core\Http\Middleware\RequireAdminAuthentication;
use TerraSphere\Media\Http\Controllers\Admin\MediaBulkDeleteController;
use TerraSphere\Media\Http\Controllers\Admin\MediaController;
use TerraSphere\Media\Http\Controllers\Admin\MediaDeleteController;
use TerraSphere\Media\Http\Controllers\Admin\MediaDuplicateController;
use TerraSphere\Media\Http\Controllers\Admin\MediaEditController;
use TerraSphere\Media\Http\Controllers\Admin\MediaPickerController;
use TerraSphere\Media\Http\Controllers\Admin\MediaRenameController;
use TerraSphere\Media\Http\Controllers\Admin\MediaUpdateController;
use TerraSphere\Media\Http\Controllers\Admin\MediaUploadController;
use TerraSphere\Media\Http\Controllers\MediaFileController;
use TerraSphere\Media\Http\Controllers\MediaThumbnailController;

Route::middleware('web')
    ->get(
        '/media/{asset}/thumbnail/{filename?}',
        MediaThumbnailController::class,
    )
    ->name('terrasphere.media.thumbnail');

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
        Route::get('/media-picker', MediaPickerController::class)->name('picker');
        Route::post('/media', MediaUploadController::class)->name('store');
        Route::delete('/media', MediaBulkDeleteController::class)->name('destroy-many');
        Route::get('/media/{asset}/edit', MediaEditController::class)->name('edit');
        Route::post('/media/{asset}/duplicate', MediaDuplicateController::class)->name('duplicate');
        Route::patch('/media/{asset}/name', MediaRenameController::class)->name('rename');
        Route::put('/media/{asset}', MediaUpdateController::class)->name('update');
        Route::delete('/media/{asset}', MediaDeleteController::class)->name('destroy');
    });
