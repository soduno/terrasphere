<?php

declare(strict_types=1);

namespace TerraSphere\Core\Admin;

final class AdminNavigation
{
    /**
     * @var array<string, array{name: string, href: string, icon: string}>
     */
    private array $items = [
        'dashboard' => ['name' => 'Dashboard', 'href' => '/admin', 'icon' => 'dashboard'],
        'content' => ['name' => 'Content', 'href' => '/admin/content', 'icon' => 'content'],
        'settings' => ['name' => 'Settings', 'href' => '/admin/settings', 'icon' => 'settings'],
        'extensions' => ['name' => 'Extensions', 'href' => '/admin/extensions', 'icon' => 'extensions'],
        'profile' => ['name' => 'Profile', 'href' => '/admin/profile', 'icon' => 'profile'],
    ];

    public function add(
        string $key,
        string $name,
        string $href,
        string $icon,
        ?string $after = null,
    ): void
    {
        $item = compact('name', 'href', 'icon');

        if ($after === null || ! array_key_exists($after, $this->items)) {
            $this->items[$key] = $item;

            return;
        }

        $items = [];
        foreach ($this->items as $existingKey => $existingItem) {
            $items[$existingKey] = $existingItem;
            if ($existingKey === $after) {
                $items[$key] = $item;
            }
        }

        $this->items = $items;
    }

    /**
     * @return list<array{name: string, href: string, icon: string}>
     */
    public function all(): array
    {
        return array_values($this->items);
    }
}
