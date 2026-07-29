<?php

declare(strict_types=1);

namespace TerraSphere\Core\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use TerraSphere\Core\Models\Menu;
use TerraSphere\Core\Models\MenuItem;
use TerraSphere\Core\Models\Page;

final class MenuController
{
    public function index(): Response
    {
        return Inertia::render('Admin/Menus', [
            'menus' => Menu::query()
                ->withCount('items')
                ->latest('updated_at')
                ->get()
                ->map(fn (Menu $menu): array => [
                    'id' => $menu->id,
                    'name' => $menu->name,
                    'slug' => $menu->slug,
                    'location' => $menu->location,
                    'itemCount' => $menu->items_count,
                    'updatedAt' => $menu->updated_at?->toISOString(),
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        $slug = Str::slug($validated['name']);
        $originalSlug = $slug;
        $counter = 1;
        while (Menu::query()->where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }

        Menu::query()->create([
            'name' => $validated['name'],
            'slug' => $slug,
            'location' => $validated['location'] ?? null,
        ]);

        return redirect()
            ->route('terrasphere.admin.menus')
            ->with('success', 'Menu created successfully.');
    }

    public function update(Request $request, Menu $menu): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        $menu->update([
            'name' => $validated['name'],
            'location' => $validated['location'] ?? null,
        ]);

        return redirect()
            ->route('terrasphere.admin.menus')
            ->with('success', 'Menu updated successfully.');
    }

    public function destroy(Menu $menu): RedirectResponse
    {
        $menu->delete();

        return redirect()
            ->route('terrasphere.admin.menus')
            ->with('success', 'Menu deleted.');
    }

    public function destroyMany(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'distinct', 'exists:menus,id'],
        ]);

        Menu::query()->whereKey($validated['ids'])->delete();

        $count = count($validated['ids']);

        return redirect()
            ->route('terrasphere.admin.menus')
            ->with('success', $count === 1 ? 'Menu deleted.' : "{$count} menus deleted.");
    }

    public function edit(Menu $menu): Response
    {
        $menu->load(['items.children', 'items.page']);

        return Inertia::render('Admin/MenuEditor', [
            'menu' => [
                'id' => $menu->id,
                'name' => $menu->name,
                'slug' => $menu->slug,
                'location' => $menu->location,
                'items' => $menu->rootItems->map(fn (MenuItem $item) => $this->serializeItem($item)),
            ],
            'pages' => Page::query()
                ->where('status', 'published')
                ->orderBy('title')
                ->get()
                ->map(fn (Page $page): array => [
                    'id' => $page->id,
                    'title' => $page->title,
                ]),
        ]);
    }

    public function addItem(Request $request, Menu $menu): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:page,custom'],
            'page_id' => ['nullable', 'integer', 'exists:pages,id'],
            'url' => ['nullable', 'string', 'max:2048'],
            'label' => ['required', 'string', 'max:255'],
        ]);

        $maxOrder = $menu->items()->max('order') ?? -1;

        $menu->items()->create([
            'type' => $validated['type'],
            'page_id' => $validated['page_id'] ?? null,
            'url' => $validated['url'] ?? null,
            'label' => $validated['label'],
            'order' => $maxOrder + 1,
        ]);

        return back()->with('success', 'Item added to menu.');
    }

    public function updateItem(Request $request, MenuItem $item): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'url' => ['nullable', 'string', 'max:2048'],
            'css_classes' => ['nullable', 'string', 'max:255'],
            'target' => ['required', 'in:_self,_blank'],
        ]);

        $item->update($validated);

        if ($request->wantsJson()) {
            return response()->json(['updated' => true]);
        }

        return back()->with('success', 'Item updated.');
    }

    public function sync(Request $request, Menu $menu): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'integer'],
            'items.*.type' => ['required', 'in:page,custom'],
            'items.*.page_id' => ['nullable', 'integer', 'exists:pages,id'],
            'items.*.url' => ['nullable', 'string', 'max:2048'],
            'items.*.label' => ['required', 'string', 'max:255'],
            'items.*.target' => ['required', 'in:_self,_blank'],
            'items.*.parent_id' => ['nullable', 'integer'],
            'items.*.order' => ['required', 'integer', 'min:0'],
            'items.*.children' => ['nullable', 'array'],
        ]);

        $existingIds = $menu->items()->pluck('id')->toArray();
        $incomingIds = [];
        $idMapping = [];

        $processItems = function (array $items, ?int $parentId) use ($menu, $existingIds, &$incomingIds, &$idMapping, &$processItems): void {
            foreach ($items as $item) {
                if ($item['id'] < 0 || ! in_array($item['id'], $existingIds, true)) {
                    $newItem = $menu->items()->create([
                        'type' => $item['type'],
                        'page_id' => $item['page_id'] ?? null,
                        'url' => $item['url'] ?? null,
                        'label' => $item['label'],
                        'target' => $item['target'],
                        'parent_id' => $parentId,
                        'order' => $item['order'],
                    ]);
                    $idMapping[$item['id']] = $newItem->id;
                    $incomingIds[] = $newItem->id;
                } else {
                    $incomingIds[] = $item['id'];
                    MenuItem::query()->whereKey($item['id'])->update([
                        'parent_id' => $parentId,
                        'order' => $item['order'],
                        'label' => $item['label'],
                    ]);
                }

                if (! empty($item['children'])) {
                    $actualParentId = $idMapping[$item['id']] ?? $item['id'];
                    $processItems($item['children'], $actualParentId);
                }
            }
        };

        $processItems($validated['items'], null);

        $toDelete = array_diff($existingIds, $incomingIds);
        if ($toDelete !== []) {
            MenuItem::query()->whereKey($toDelete)->delete();
        }

        return back()->with('success', 'Menu saved.');
    }

    public function destroyItem(Request $request, MenuItem $item): RedirectResponse|JsonResponse
    {
        $item->delete();

        if ($request->wantsJson()) {
            return response()->json(['deleted' => true]);
        }

        return back()->with('success', 'Item removed.');
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeItem(MenuItem $item): array
    {
        return [
            'id' => $item->id,
            'type' => $item->type,
            'page_id' => $item->page_id,
            'url' => $item->url,
            'label' => $item->label,
            'css_classes' => $item->css_classes,
            'target' => $item->target,
            'order' => $item->order,
            'page' => $item->page ? [
                'id' => $item->page->id,
                'title' => $item->page->title,
            ] : null,
            'children' => $item->children->map(fn (MenuItem $child) => $this->serializeItem($child))->values(),
        ];
    }
}
