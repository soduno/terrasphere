<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use TerraSphere\Core\Http\Controllers\Admin\AuthenticationController;
use TerraSphere\Core\Http\Controllers\Admin\DashboardController;
use TerraSphere\Core\Http\Controllers\Admin\FieldSetController;
use TerraSphere\Core\Http\Controllers\Admin\MenuController;
use TerraSphere\Core\Http\Controllers\Admin\PageController;
use TerraSphere\Core\Http\Controllers\Admin\ProfileController;
use TerraSphere\Core\Http\Controllers\Admin\SettingsController;
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
            Route::delete('/pages', [PageController::class, 'destroyMany'])
                ->name('pages.destroy-many');
            Route::delete('/pages/{page}', [PageController::class, 'destroy'])
                ->name('pages.destroy');
            Route::get('/settings', [SettingsController::class, 'edit'])
                ->name('settings');
            Route::put('/settings', [SettingsController::class, 'update'])
                ->name('settings.update');
            Route::get('/roles', fn (): Response => Inertia::render('Admin/Roles'))
                ->name('roles');
            Route::get('/field-sets', [FieldSetController::class, 'index'])
                ->name('field-sets');
            Route::post('/field-sets', [FieldSetController::class, 'store'])
                ->name('field-sets.store');
            Route::put('/field-sets/{fieldSet}', [FieldSetController::class, 'update'])
                ->name('field-sets.update');
            Route::delete('/field-sets/{fieldSet}', [FieldSetController::class, 'destroy'])
                ->name('field-sets.destroy');
            Route::delete('/field-sets', [FieldSetController::class, 'destroyMany'])
                ->name('field-sets.destroy-many');
            Route::get('/field-sets/{fieldSet}/fields', [FieldSetController::class, 'editFields'])
                ->name('field-sets.fields');
            Route::put('/field-sets/{fieldSet}/fields', [FieldSetController::class, 'saveFields'])
                ->name('field-sets.fields.update');
            Route::get('/menus', [MenuController::class, 'index'])
                ->name('menus');
            Route::post('/menus', [MenuController::class, 'store'])
                ->name('menus.store');
            Route::put('/menus/{menu}', [MenuController::class, 'update'])
                ->name('menus.update');
            Route::delete('/menus/{menu}', [MenuController::class, 'destroy'])
                ->name('menus.destroy');
            Route::delete('/menus', [MenuController::class, 'destroyMany'])
                ->name('menus.destroy-many');
            Route::get('/menus/{menu}/edit', [MenuController::class, 'edit'])
                ->name('menus.edit');
            Route::post('/menus/{menu}/items', [MenuController::class, 'addItem'])
                ->name('menus.items.store');
            Route::put('/items/{item}', [MenuController::class, 'updateItem'])
                ->name('items.update');
            Route::put('/menus/{menu}/sync', [MenuController::class, 'sync'])
                ->name('menus.sync');
            Route::delete('/items/{item}', [MenuController::class, 'destroyItem'])
                ->name('items.destroy');
            Route::get('/extensions', fn (): Response => Inertia::render('Admin/Extensions'))
                ->name('extensions');
            Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
            Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
            Route::put('/profile/password', [ProfileController::class, 'updatePassword'])
                ->name('profile.password.update');
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
            Route::patch('/pages/{page}/title', [PageController::class, 'updateTitle'])
                ->name('pages.title.update');
            Route::patch('/pages/{page}/publish', [PageController::class, 'publish'])
                ->name('pages.publish');
        });
    });
