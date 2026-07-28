# TerraSphere CMS — Agent Instructions

## Core Rules

- TerraSphere is **not** a standard Laravel application.
- Preserve the existing architecture before introducing new abstractions.
- Never place application code inside the root Laravel directories unless the
  user explicitly requests an architectural change.
- Follow nearby project conventions before introducing new patterns.
- Keep changes limited to the requested scope.
- Do not perform unrelated refactors, formatting-only changes, or file moves.
- Preserve existing public APIs, extension contracts, routes, response shapes,
  component props, and database behaviour unless a breaking change is explicitly
  requested.
- Never claim that verification succeeded unless the command was actually run.

---

## Instruction Priority

When instructions conflict, follow this order:

1. Preserve TerraSphere's architecture.
2. Follow existing project conventions.
3. Keep changes as small as possible.
4. Preserve backwards compatibility.
5. Prefer the simplest implementation.

---

## Working Method

For every implementation task:

1. Start from the files explicitly mentioned by the user.
2. Search for related symbols before opening unrelated files.
3. Inspect nearby implementations to understand the existing pattern.
4. Identify affected packages.
5. Implement the smallest coherent solution.
6. Verify the implementation.
7. Review the final diff for unrelated changes.

---

## Working Scope

Unless explicitly requested:

- Do **not** scan the entire repository.
- Do **not** perform repository-wide refactors.
- Read only files required to solve the task.
- Search before opening files.
- Follow imports instead of scanning directories.
- Avoid changing unrelated code while "already there."
- If the implementation requires changes across multiple packages, identify why
  before continuing.

---

## Planning Mode

When the user asks to investigate or create a plan:

- Never modify files.
- Explain the current implementation.
- Identify the entry points.
- List expected files to change.
- Mention architectural risks.
- Mention migration or compatibility risks.
- End with a concrete implementation order.

---

# Architecture

## Bootstrap

TerraSphere is **not** a standard Laravel application.

Application bootstrapping happens through:

- `index.php`
- `artisan`

Both call:

```php
Core::bootstrap();
```

instead of Laravel's normal

```php
Illuminate\Foundation\Application
```

Never assume a standard Laravel bootstrap.

---

## Repository Structure

The runtime lives inside:

```
packages/core/
```

The following Laravel directories are **not used**:

```
app/
config/
routes/
public/
```

Do not create or modify files there unless explicitly requested.

---

## PSR-4

```
packages/core/src/
```

maps to

```
TerraSphere\Core\
```

Controllers belong in

```
packages/core/src/Http/Controllers/Admin/
```

Models belong in

```
packages/core/src/Models/
```

---

## Models

All first-party models use

```php
HasUuids
```

Never assume integer IDs.

Primary keys and foreign keys should always be treated as UUID strings.

---

# Essential Commands

```bash
# Start everything
docker compose up --build

# Frontend
npm install
npm run dev

# TypeScript
npm run typecheck

# Production build
npm run build

# Artisan
docker compose exec app php artisan <command>

# Create admin
docker compose exec app php artisan terrasphere:admin <email> --username=<name>

# Docker frontend
docker compose --profile docker-frontend up -d frontend
```

---

# Package Ownership

| Directory | Purpose |
|------------|---------|
| packages/core | Core CMS functionality |
| packages/media | Media package |
| extends/* | Extensions |
| themes | Themes |

Rules:

- Generic CMS functionality belongs inside `packages/core`.
- Media functionality belongs inside `packages/media`.
- Optional features belong inside extensions.
- Don't add extension-specific logic to core unless intended.
- Don't bypass package APIs through direct imports.
- Before changing shared contracts, search usages across both `packages/` and `extends/`.
---

# Frontend

## Entry Point and Page Resolution

The Vite entry point is:

```text
packages/core/resources/js/admin.tsx
```

Inertia pages are resolved through:

```ts
import.meta.glob('./Pages/**/*.tsx')
```

A page named:

```text
Admin/Foo
```

resolves to:

```text
./Pages/Admin/Foo.tsx
```

Media pages resolve from a separate glob.

All pages except:

```text
Admin/Login
```

are wrapped in `AdminLayout` automatically.

---

## Path Aliases

Use the existing aliases:

| Alias | Purpose |
|-------|---------|
| `@ui` | UI primitives |
| `@components` | Higher-level shared components |
| `@adapter` | API client and adapters |
| `@media` | Media package frontend code |

Do not introduce new aliases unless there is a clear project-wide need.

Vite's `publicDirectory` is:

```text
.
```

which means the project root is used instead of a root `public/` directory.

---

## Frontend Conventions

- Reuse existing components from `@ui` and `@components` before creating new
  ones.
- Keep page components focused on page composition, data flow, and page-specific
  behavior.
- Move reusable stateful behavior into hooks or composables that follow existing
  project patterns.
- Preserve strict TypeScript types.
- Avoid `any`; do not use it merely to bypass a type error.
- Do not suppress TypeScript errors without documenting the reason.
- Do not introduce another API client.
- Do not use raw `fetch` when the existing API adapter supports the request.
- Do not duplicate shared component behavior inside individual pages.
- Follow existing naming and file-placement conventions in nearby frontend code.

---

## Inertia Page Props

Inertia page-prop interfaces must include an index signature to satisfy
Inertia's `PageProps` constraint:

```ts
interface PageProps {
  [key: string]: unknown;

  auth: {
    user: {
      // ...
    };
  };
}
```

Do not remove the index signature during refactoring.

---

## API Requests

All application API requests must use:

```ts
import { api } from '@adapter/api';
```

The adapter supports:

```text
get
post
put
patch
delete
```

For Inertia visits, pass:

```ts
{ inertia: true }
```

as the request options.

Do not introduce raw `fetch`, a new Axios instance, or another request client
unless the existing adapter cannot support the required behavior.

---

# Backend Conventions

## PHP Files

Every PHP file must include:

```php
declare(strict_types=1);
```

Do not omit it from new files.

---

## Controllers

- Controllers must be declared as `final`.
- Controllers must not extend Laravel's base controller.
- Use constructor injection for dependencies.
- Keep controllers focused on request handling, validation, and responses.
- Move reusable business or domain behavior into dedicated services or actions
  that follow existing project patterns.
- Validate external input before processing it.
- Do not access request globals such as `$_POST`, `$_GET`, or `$_ENV` directly.

Controllers belong in:

```text
packages/core/src/Http/Controllers/Admin/
```

Do not place them in:

```text
app/Http/Controllers/
```

---

## Routes

Admin routes belong in:

```text
packages/core/routes/web.php
```

They use:

```text
/admin
```

as the URL prefix and:

```text
terrasphere.admin.
```

as the route-name prefix.

Authenticated admin routes must use:

```php
RequireAdminAuthentication
```

middleware.

There is no active root:

```text
routes/web.php
```

Do not create one for TerraSphere features.

---

## Authentication

`CoreServiceProvider` overrides the user model with:

```php
TerraSphere\Core\Models\User
```

and merges:

```text
packages/core/config/auth.php
```

Do not rely on a root `config/auth.php`.

---

## Admin Navigation

`AdminNavigation` is registered as a singleton.

Extensions add sidebar items from their service provider with:

```php
app(AdminNavigation::class)->add(
    key,
    name,
    href,
    icon,
    after?
);
```

Do not hardcode extension navigation inside core unless it is intentionally part
of the core product.

---

## Views and Inertia Shared Data

Database migrations belong in:

```text
packages/core/database/migrations/
```

Blade views use the namespace:

```text
terrasphere::<name>
```

Example:

```text
terrasphere::admin
```

The Inertia middleware shares:

- `auth.user`
  - `uuid`
  - `username`
  - `email`
- `adminNavigation`
- flash `success`

For successful controller actions, use:

```php
return back()->with('success', '...');
```

The middleware exposes the message as the `success` prop.

---

# Database Changes

- Do not edit an existing migration that may already have been executed unless
  the user explicitly requests it.
- Create a new migration for schema changes.
- Use UUID-compatible primary keys, foreign keys, and related column types.
- Never assume auto-incrementing integer IDs.
- Preserve existing data unless destructive behavior is explicitly requested.
- Consider rollback behavior for every schema change.
- Do not silently change persisted data formats.
- Search for all model, controller, API, and frontend usages before renaming or
  removing a database column.
- Do not run destructive database commands without explicit approval.

Destructive commands include:

```bash
php artisan migrate:fresh
php artisan db:wipe
```

and destructive SQL such as:

```sql
DROP TABLE
TRUNCATE TABLE
```

Run Artisan commands through the application container:

```bash
docker compose exec app php artisan <command>
```

---

# Compatibility

- Preserve existing route names and URLs.
- Preserve component props and Inertia page-prop shapes.
- Preserve API request and response formats.
- Preserve extension contracts and public package APIs.
- Treat classes and methods used by extensions as public APIs.
- Before changing a shared contract, search for usages across:
  - `packages/`
  - `extends/`
  - relevant frontend code
- Do not introduce a new abstraction when an established TerraSphere
  abstraction already exists.
- Do not make breaking changes implicitly.
- If a breaking change is required, identify it clearly before implementation.

---

# Docker

- The entrypoint creates `.env` from `.env.example` on first start.
- `composer install` runs on every container start.
- MySQL version 8.4 is used.
- From inside containers, the MySQL host is:

```text
mysql
```

- Caddy reverse-proxies port `80` to PHP-FPM in the `app` container.
- Run Artisan inside the `app` container instead of assuming host PHP matches
  the project runtime.
- Do not change container ports, service names, or startup behavior unless the
  task explicitly requires it.
---

# Verification

Before considering a task complete:

- Review the final diff for unrelated changes.
- Run `npm run typecheck` after every TypeScript change.
- Run `npm run build` when frontend build behaviour, imports, aliases, or Vite
  configuration change.
- Run the relevant Artisan command when backend behaviour changes.
- Run migration status or the relevant migration command when database schema
  changes are part of the task and the environment permits it.
- Never claim a command passed unless it was actually executed successfully.
- If verification cannot be performed, clearly state what remains unverified and
  why.

---

# Common Pitfalls

## Laravel Structure

There is **no** active root:

```text
routes/web.php
```

Routes belong in:

```text
packages/core/routes/web.php
```

Do not create Laravel application files inside:

```text
app/
routes/
config/
public/
```

unless explicitly requested.

---

## Authentication

Do not rely on:

```text
config/auth.php
```

The package configuration is merged through:

```php
CoreServiceProvider::register()
```

---

## Controllers

Do not place controllers inside:

```text
app/Http/Controllers/
```

Always use:

```text
packages/core/src/Http/Controllers/Admin/
```

---

## Models

Never assume integer IDs.

All first-party models use UUIDs.

---

## API

Use:

```ts
import { api } from '@adapter/api';
```

instead of introducing:

- raw `fetch`
- another Axios instance
- another HTTP client

unless explicitly required.

---

## TypeScript

Always run:

```bash
npm run typecheck
```

after TypeScript changes.

Remember that `npm run build` also performs type checking.

---

## Flash Messages

Use:

```php
return back()->with('success', '...');
```

The middleware automatically exposes it as:

```text
success
```

to Inertia.

---

## Extension Development

Before modifying functionality that may affect extensions:

- Search usages across `packages/`.
- Search usages across `extends/`.
- Preserve extension contracts whenever possible.
- Avoid introducing breaking changes.
- If a breaking change is unavoidable, document it clearly.

---

## Performance

When investigating or implementing a task:

- Read as little of the repository as necessary.
- Prefer symbol search over directory traversal.
- Follow imports before opening unrelated files.
- Avoid repository-wide scans.
- Avoid repository-wide formatting.
- Avoid opportunistic cleanup.

---

## Code Quality

Prefer:

- existing abstractions
- existing naming conventions
- existing folder structure

Avoid introducing:

- duplicate helpers
- duplicate hooks
- duplicate services
- duplicate abstractions

If similar functionality already exists, extend it instead of creating a new
implementation.

---

## Philosophy

TerraSphere prioritises:

1. Consistency over cleverness.
2. Small, focused changes over large refactors.
3. Predictability over novelty.
4. Backwards compatibility whenever practical.
5. Following existing project conventions before introducing new ones.

When in doubt:

- inspect nearby implementations,
- follow the established pattern,
- keep the solution simple,
- minimise the scope of change.