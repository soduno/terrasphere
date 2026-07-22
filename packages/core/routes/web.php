<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use TerraSphere\Core\Http\Controllers\Admin\DashboardController;
use TerraSphere\Core\Http\Middleware\HandleAdminInertiaRequests;

Route::view('/', 'terrasphere::welcome')->name('terrasphere.home');

Route::middleware(['web', HandleAdminInertiaRequests::class])
    ->get('/admin', DashboardController::class)
    ->name('terrasphere.admin.dashboard');
