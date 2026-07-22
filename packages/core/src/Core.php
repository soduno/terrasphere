<?php

declare(strict_types=1);

namespace TerraSphere\Core;

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Symfony\Component\Console\Input\ArgvInput;

final class Core
{
    private ?Application $application = null;

    private function __construct(
        private readonly string $basePath,
    ) {
    }

    public static function bootstrap(string $basePath): self
    {
        if (! defined('TERRASPHERE_START')) {
            define('TERRASPHERE_START', microtime(true));
        }

        if (! defined('LARAVEL_START')) {
            define('LARAVEL_START', TERRASPHERE_START);
        }

        return new self(rtrim($basePath, '/\\'));
    }

    public function run(): void
    {
        $this->loadMaintenanceMode();
        $this->application()->handleRequest(Request::capture());
    }

    public function runConsole(): int
    {
        return $this->application()->handleCommand(new ArgvInput());
    }

    public function application(): Application
    {
        return $this->application ??= LaravelBootstrapper::bootstrap(
            basePath: $this->basePath,
        );
    }

    private function loadMaintenanceMode(): void
    {
        $maintenance = $this->basePath.'/storage/framework/maintenance.php';

        if (is_file($maintenance)) {
            require $maintenance;
        }
    }
}
