# TerraSphere CMS

TerraSphere is a minimal Laravel application shell with its CMS logic isolated
in the local `terrasphere/core` Composer package.

## Structure

```text
themes/          CMS themes
extends/         installable CMS extensions/plugins
packages/core/   first-party Core package, bootstrap, routes, and views
storage/         writable runtime data
vendor/          Composer dependencies (generated)
index.php        Laravel HTTP bootstrap
```

## Start locally

Docker and Docker Compose are the only host requirements. Caddy serves the
application through PHP-FPM; Apache and `.htaccess` are not used.

```bash
docker compose up --build
```

The app is then available at <http://localhost:8080>. On its first start, the
container installs Composer dependencies and generates the Laravel application
key. MySQL is exposed on port `3306` by default.

Run Artisan and Composer inside the app container:

```bash
docker compose exec app php artisan about
docker compose exec app composer show terrasphere/core
```

Copy `.env.example` to `.env` before starting if you want to override the
development defaults. Never use the included passwords in production.

The backend intentionally has no frontend stack yet. React and Inertia can be
added to the CMS administration surface without coupling them to the root
application shell.

## Boot sequence

The root `index.php` starts `TerraSphere\Core\Core` and has no direct Laravel
dependency. Core owns maintenance mode, Laravel construction, request capture,
and dispatch. `LaravelBootstrapper` is the internal adapter between TerraSphere
Core and the underlying Laravel framework.

## Administration UI

The React, TypeScript, and Inertia administration UI is available at <http://localhost:8080/admin>.
It is isolated to the `/admin` route; the public `/` entrypoint remains a normal
Core-rendered Blade view. Start Vite directly on the host for fast hot module
replacement on Windows:

```bash
npm install
npm run dev
```

The optional Docker-based Vite service can be started with polling via:

```bash
docker compose --profile docker-frontend up -d frontend
```

Build production assets with:

```bash
docker compose run --rm frontend npm run build
```

The administration area is protected by session authentication. Create the
first administrator, then sign in at <http://localhost:8080/admin/login>:

```bash
php artisan terrasphere:admin admin@example.com --username=admin
```

The command prompts securely for a password. When using Docker, prefix the
command with `docker compose exec app`.
