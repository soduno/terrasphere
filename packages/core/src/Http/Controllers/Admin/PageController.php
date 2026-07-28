<?php

declare(strict_types=1);

namespace TerraSphere\Core\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use TerraSphere\Core\Models\Page;
use TerraSphere\Core\Models\FieldSet;

final class PageController
{
    public function index(Request $request): Response
    {
        $filter = $request->query('filter', 'all');

        $pagesQuery = Page::query()->latest('updated_at');

        if ($filter === 'wysiwyg') {
            $pagesQuery->where('content_type', 'wysiwyg');
        } elseif ($filter === 'custom_fields') {
            $pagesQuery->where('content_type', 'custom_fields');
        }

        return Inertia::render('Admin/Content', [
            'pages' => $pagesQuery
                ->get()
                ->map(fn (Page $page): array => [
                    'id' => $page->id,
                    'title' => $page->title,
                    'type' => $page->content_type,
                    'status' => $page->status,
                    'updatedAt' => $page->updated_at?->toISOString(),
                ]),
            'filter' => $filter,
            'fieldSets' => FieldSet::query()
                ->whereNotNull('field_schema')
                ->whereRaw('JSON_LENGTH(field_schema) > 0')
                ->orderBy('name')
                ->get()
                ->map(fn (FieldSet $fieldSet): array => [
                    'id' => $fieldSet->id,
                    'name' => $fieldSet->name,
                    'fieldCount' => count($fieldSet->field_schema ?? []),
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'content_type' => ['required', 'in:wysiwyg,custom_fields'],
            'field_set_id' => ['nullable', 'integer', 'exists:field_sets,id'],
        ]);

        $fieldSchema = [];
        $draftFieldValues = [];

        if ($validated['content_type'] === 'custom_fields') {
            $draftFieldValues = [];

            if (isset($validated['field_set_id'])) {
                $fieldSet = FieldSet::query()->findOrFail($validated['field_set_id']);
                $fieldSchema = $fieldSet->field_schema ?? [];
            }
        }

        $page = Page::query()->create([
            'title' => 'Untitled Page',
            'slug' => 'untitled-page-'.Str::lower(Str::random(8)),
            'content_type' => $validated['content_type'],
            'draft_elements' => [],
            'field_schema' => $validated['content_type'] === 'custom_fields' ? $fieldSchema : null,
            'draft_field_values' => $validated['content_type'] === 'custom_fields' ? $draftFieldValues : null,
        ]);

        if ($page->content_type === 'wysiwyg') {
            return redirect()->route('terrasphere.admin.editor', $page);
        }

        return isset($validated['field_set_id'])
            ? redirect()->route('terrasphere.admin.fields-editor', $page)
            : redirect()->route('terrasphere.admin.fields-builder', $page);
    }

    public function editWysiwyg(Request $request, Page $page): Response
    {
        abort_unless($page->content_type === 'wysiwyg', 404);
        $userSettings = $request->user()?->settings?->settings ?? [];

        return Inertia::render('Admin/Editor', [
            'page' => [
                'id' => $page->id,
                'title' => $page->title,
                'elements' => $page->draft_elements ?? [],
                'lockVersion' => $page->lock_version,
                'updatedAt' => $page->updated_at?->toISOString(),
            ],
            'propertySectionOrder' => $userSettings['editor']['property_section_order'] ?? [],
        ]);
    }

    public function saveWysiwyg(Request $request, Page $page): JsonResponse
    {
        abort_unless($page->content_type === 'wysiwyg', 404);

        $validated = $request->validate([
            'elements' => ['required', 'array'],
            'lock_version' => ['required', 'integer', 'min:0'],
        ]);

        $updated = Page::query()
            ->whereKey($page->getKey())
            ->where('lock_version', $validated['lock_version'])
            ->update([
                'draft_elements' => json_encode($validated['elements'], JSON_THROW_ON_ERROR),
                'lock_version' => DB::raw('lock_version + 1'),
                'updated_at' => now(),
            ]);

        if ($updated === 0) {
            return response()->json([
                'message' => 'This page was updated elsewhere. Refresh before continuing.',
            ], 409);
        }

        $page->refresh();

        return response()->json([
            'lockVersion' => $page->lock_version,
            'updatedAt' => $page->updated_at?->toISOString(),
        ]);
    }

    public function editFieldSchema(Page $page): Response
    {
        abort_unless($page->content_type === 'custom_fields', 404);

        return Inertia::render('Admin/FieldsBuilder', [
            'page' => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'rows' => $page->field_schema ?? [],
            ],
        ]);
    }

    public function saveFieldSchema(Request $request, Page $page): RedirectResponse
    {
        abort_unless($page->content_type === 'custom_fields', 404);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('pages', 'slug')->ignore($page),
            ],
            'rows' => ['required', 'array'],
        ]);

        $page->update([
            'title' => $validated['title'],
            'slug' => $validated['slug'],
            'field_schema' => $validated['rows'],
            'lock_version' => $page->lock_version + 1,
        ]);

        return redirect()->route('terrasphere.admin.fields-editor', $page);
    }

    public function editFieldValues(Page $page): Response
    {
        abort_unless($page->content_type === 'custom_fields', 404);

        return Inertia::render('Admin/FieldsEditor', [
            'page' => [
                'id' => $page->id,
                'title' => $page->title,
                'rows' => $page->field_schema ?? [],
                'values' => $page->draft_field_values ?? [],
            ],
        ]);
    }

    public function saveFieldValues(Request $request, Page $page): RedirectResponse
    {
        abort_unless($page->content_type === 'custom_fields', 404);

        $validated = $request->validate([
            'values' => ['required', 'array'],
        ]);

        $page->update([
            'draft_field_values' => $validated['values'],
            'lock_version' => $page->lock_version + 1,
        ]);

        return redirect()->route('terrasphere.admin.content');
    }

    public function updateTitle(Request $request, Page $page): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        $page->update([
            'title' => $validated['title'],
        ]);

        return redirect()->back()->with('success', 'Page title updated.');
    }

    public function destroy(Page $page): RedirectResponse
    {
        $page->delete();

        return redirect()
            ->route('terrasphere.admin.content')
            ->with('success', 'Page deleted.');
    }

    public function destroyMany(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'distinct', 'exists:pages,id'],
        ]);
        $pageIds = $validated['ids'];

        DB::transaction(function () use ($pageIds): void {
            Page::query()
                ->whereKey($pageIds)
                ->get()
                ->each(function (Page $page): void {
                    $page->delete();
                });
        });

        $count = count($pageIds);

        return redirect()
            ->route('terrasphere.admin.content')
            ->with(
                'success',
                $count === 1 ? 'Page deleted.' : "{$count} pages deleted."
            );
    }
}
