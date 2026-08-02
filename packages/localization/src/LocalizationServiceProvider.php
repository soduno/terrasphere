<?php

declare(strict_types=1);

namespace TerraSphere\Localization;

use Illuminate\Support\ServiceProvider;
use TerraSphere\Core\Admin\AdminNavigation;
use TerraSphere\Core\Localization\LocalizationManager;

final class LocalizationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(LocalizationManager::class, DatabaseLocalizationManager::class);
        $this->app->singleton(DefaultLanguageSwitcher::class);
    }

    public function boot(AdminNavigation $navigation): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        $this->loadRoutesFrom(__DIR__.'/../routes/web.php');

        $navigation->add(
            'localization',
            'Localization',
            '/admin/localization',
            'languages',
            after: 'content',
        );
    }
}
