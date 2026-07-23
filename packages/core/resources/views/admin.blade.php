<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <link rel="icon" href="data:,">
    @viteReactRefresh
    @vite('packages/core/resources/js/admin.tsx')
    <x-inertia::head>
        <title>TerraSphere Administration</title>
    </x-inertia::head>
</head>
<body>
    <x-inertia::app />
</body>
</html>
