<?php

declare(strict_types=1);

namespace TerraSphere\Media;

use Illuminate\Support\ServiceProvider;
use TerraSphere\Core\Admin\AdminNavigation;
use TerraSphere\Media\Support\UsedImageFinder;

final class MediaServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(UsedImageFinder::class);
    }

    public function boot(AdminNavigation $navigation): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        $this->loadRoutesFrom(__DIR__.'/../routes/web.php');

        $navigation->add('media', 'Media', '/admin/media', 'media', after: 'content');
    }
}
