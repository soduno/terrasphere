<?php

declare(strict_types=1);

namespace TerraSphere\Core\Admin;

final class AdminNavigation
{
    /**
     * @var array<string, array{name: string, href: string, icon: string, children?: list<array{name: string, href: string, icon: string}>}>
     */
    private array $items = [
        'dashboard' => ['name' => 'Dashboard', 'href' => '/admin', 'icon' => 'dashboard'],
        'content' => [
            'name' => 'Content',
            'href' => '/admin/content',
            'icon' => 'content',
            'children' => [
                ['name' => 'Pages', 'href' => '/admin/content', 'icon' => 'overview'],
                ['name' => 'Field Sets', 'href' => '/admin/field-sets', 'icon' => 'groups'],
                ['name' => 'Menus', 'href' => '/admin/menus', 'icon' => 'menu'],
            ],
        ],
        'settings' => [
            'name' => 'Settings',
            'href' => '/admin/settings',
            'icon' => 'settings',
            'children' => [
                ['name' => 'System', 'href' => '/admin/settings', 'icon' => 'cog'],
                ['name' => 'Profile', 'href' => '/admin/profile', 'icon' => 'profile'],
                ['name' => 'Roles', 'href' => '/admin/roles', 'icon' => 'shield'],
            ],
        ],
        'extensions' => ['name' => 'Extensions', 'href' => '/admin/extensions', 'icon' => 'extensions'],
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
     * @return list<array{name: string, href: string, icon: string, children?: list<array{name: string, href: string, icon: string}>}>
     */
    public function all(): array
    {
        return array_values($this->items);
    }
}
