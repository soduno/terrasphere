<?php

declare(strict_types=1);

namespace TerraSphere\Core;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\ApplicationBuilder;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

final class LaravelBootstrapper
{
    public static function bootstrap(string $basePath): Application
    {
        $corePath = dirname(__DIR__);

        $app = new Application($basePath);
        $app->useBootstrapPath($corePath.'/bootstrap');
        $app->useStoragePath($basePath.'/storage');

        return (new ApplicationBuilder($app))
            ->withKernels()
            ->withEvents()
            ->withCommands()
            ->withProviders()
            ->withRouting(
                commands: $corePath.'/routes/console.php',
                health: '/up',
            )
            ->withMiddleware(function (Middleware $middleware): void {
                // TerraSphere middleware will be registered here.
            })
            ->withExceptions(function (Exceptions $exceptions): void {
                // TerraSphere exception handling will be configured here.
            })
            ->create();
    }
}
