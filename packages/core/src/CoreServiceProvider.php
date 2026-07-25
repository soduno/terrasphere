<?php

declare(strict_types=1);

namespace TerraSphere\Core;

use Illuminate\Support\ServiceProvider;
use TerraSphere\Core\Admin\AdminNavigation;
use TerraSphere\Core\Console\CreateAdminUserCommand;
use TerraSphere\Core\Models\User;

final class CoreServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/auth.php', 'auth');
        $this->app['config']->set('auth.providers.users.model', User::class);
        $this->app->singleton(AdminNavigation::class);
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'terrasphere');

        if ($this->app->runningInConsole()) {
            $this->commands([CreateAdminUserCommand::class]);
        }
    }
}
