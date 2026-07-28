<?php

declare(strict_types=1);

namespace TerraSphere\Core\Http\Controllers\Admin;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use TerraSphere\Core\Models\FieldSet;

final class FieldSetController
{
    public function index(): Response
    {
        return Inertia::render('Admin/FieldSets', [
            'fieldSets' => FieldSet::query()
                ->latest('updated_at')
                ->get()
                ->map(fn (FieldSet $fieldSet): array => [
                    'id' => $fieldSet->id,
                    'name' => $fieldSet->name,
                    'slug' => $fieldSet->slug,
                    'description' => $fieldSet->description,
                    'fieldCount' => count($fieldSet->field_schema ?? []),
                    'updatedAt' => $fieldSet->updated_at?->toISOString(),
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $slug = Str::slug($validated['name']);

        $originalSlug = $slug;
        $counter = 1;
        while (FieldSet::query()->where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }

        $fieldSet = FieldSet::query()->create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'field_schema' => [],
        ]);

        return redirect()
            ->route('terrasphere.admin.field-sets.fields', $fieldSet);
    }

    public function update(Request $request, FieldSet $fieldSet): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $fieldSet->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()
            ->route('terrasphere.admin.field-sets')
            ->with('success', 'Field set updated successfully.');
    }

    public function destroy(FieldSet $fieldSet): RedirectResponse
    {
        $fieldSet->delete();

        return redirect()
            ->route('terrasphere.admin.field-sets')
            ->with('success', 'Field set deleted.');
    }

    public function destroyMany(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'distinct', 'exists:field_sets,id'],
        ]);

        FieldSet::query()->whereKey($validated['ids'])->delete();

        $count = count($validated['ids']);

        return redirect()
            ->route('terrasphere.admin.field-sets')
            ->with(
                'success',
                $count === 1 ? 'Field set deleted.' : "{$count} field sets deleted."
            );
    }

    public function editFields(FieldSet $fieldSet): Response
    {
        return Inertia::render('Admin/FieldsBuilder', [
            'page' => [
                'id' => $fieldSet->id,
                'title' => $fieldSet->name,
                'slug' => $fieldSet->slug,
                'rows' => $fieldSet->field_schema ?? [],
            ],
            'saveUrl' => route('terrasphere.admin.field-sets.fields.update', $fieldSet),
            'backUrl' => route('terrasphere.admin.field-sets'),
        ]);
    }

    public function saveFields(Request $request, FieldSet $fieldSet): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('field_sets', 'slug')->ignore($fieldSet),
            ],
            'rows' => ['required', 'array'],
        ]);

        $fieldSet->update([
            'name' => $validated['title'],
            'slug' => $validated['slug'],
            'field_schema' => $validated['rows'],
        ]);

        return redirect()
            ->route('terrasphere.admin.field-sets')
            ->with('success', 'Field set fields updated successfully.');
    }
}
