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
use TerraSphere\Core\Localization\LocalizationManager;
use TerraSphere\Core\Models\Page;
use TerraSphere\Core\Models\FieldSet;

final class PageController
{
    public function __construct(
        private readonly LocalizationManager $localization,
    ) {
    }

    public function index(Request $request): Response
    {
        $filter = $request->query('filter', 'all');

        $pagesQuery = Page::query()->latest('updated_at');

        if ($filter === 'wysiwyg') {
            $pagesQuery->where('content_type', 'wysiwyg');
        } elseif ($filter === 'custom_fields') {
            $pagesQuery->where('content_type', 'custom_fields');
        }

        $languages = $this->localization->languages();
        $defaultLocale = $this->localization->defaultLocale();
        $pages = $pagesQuery->get();
        $translatedLocales = $this->localization->translatedLocalesFor(
            'page',
            $pages->modelKeys(),
            ['page', 'wysiwyg', 'field_values'],
        );

        return Inertia::render('Admin/Content', [
            'pages' => $pages
                ->map(function (Page $page) use ($defaultLocale, $translatedLocales): array {
                    return [
                        'id' => $page->id,
                        'title' => $page->title,
                        'type' => $page->content_type,
                        'status' => $page->status,
                        'translatedLocales' => [
                            $defaultLocale,
                            ...($translatedLocales[(string) $page->id] ?? []),
                        ],
                        'updatedAt' => $page->updated_at?->toISOString(),
                    ];
                }),
            'languages' => $languages,
            'defaultLocale' => $defaultLocale,
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
        $locale = $this->requestedLocale($request);
        $localizedPage = $this->localization->values('page', $page->id, $locale, 'page');
        $localizedEditor = $this->localization->values('page', $page->id, $locale, 'wysiwyg');
        $translatedLocales = $this->localization->translatedLocales(
            'page',
            $page->id,
            ['wysiwyg'],
        );
        $defaultLocale = $this->localization->defaultLocale();
        $languages = $this->localization->languages();

        return Inertia::render('Admin/Editor', [
            'page' => [
                'id' => $page->id,
                'title' => $this->localization->isDefault($locale)
                    ? $page->title
                    : ($localizedPage['title'] ?? $page->title),
                'status' => $page->status,
                'elements' => $this->localization->isDefault($locale)
                    ? ($page->draft_elements ?? [])
                    : ($localizedEditor['elements'] ?? []),
                'lockVersion' => $page->lock_version,
                'updatedAt' => $page->updated_at?->toISOString(),
            ],
            'languages' => $languages,
            'locale' => $locale,
            'hasTranslation' => $this->localization->isDefault($locale)
                || in_array($locale, $translatedLocales, true),
            'translationSources' => array_values(array_filter(
                $languages,
                fn (array $language): bool => $language['locale'] === $defaultLocale
                    || in_array($language['locale'], $translatedLocales, true),
            )),
            'propertySectionOrder' => $userSettings['editor']['property_section_order'] ?? [],
        ]);
    }

    public function duplicateWysiwygTranslation(
        Request $request,
        Page $page,
        string $locale,
    ): JsonResponse {
        abort_unless($page->content_type === 'wysiwyg', 404);
        $targetLocale = $this->validatedLocale($locale);

        abort_if($this->localization->isDefault($targetLocale), 422, 'The default language already owns the original content.');

        $validated = $request->validate([
            'source_locale' => ['required', 'string', 'max:35'],
        ]);
        $sourceLocale = $this->validatedLocale($validated['source_locale']);

        abort_if($sourceLocale === $targetLocale, 422, 'Choose a different source language.');

        $translatedLocales = $this->localization->translatedLocales(
            'page',
            $page->id,
            ['wysiwyg'],
        );
        $sourceExists = $this->localization->isDefault($sourceLocale)
            || in_array($sourceLocale, $translatedLocales, true);

        abort_unless($sourceExists, 422, 'The selected source language has no WYSIWYG content.');
        abort_if(
            in_array($targetLocale, $translatedLocales, true),
            422,
            'The target language already has WYSIWYG content.',
        );

        $sourcePage = $this->localization->isDefault($sourceLocale)
            ? ['title' => $page->title]
            : $this->localization->values('page', $page->id, $sourceLocale, 'page');
        $sourceEditor = $this->localization->isDefault($sourceLocale)
            ? ['elements' => $page->draft_elements ?? []]
            : $this->localization->values('page', $page->id, $sourceLocale, 'wysiwyg');

        DB::transaction(function () use (
            $page,
            $targetLocale,
            $sourcePage,
            $sourceEditor,
        ): void {
            $this->localization->putValues(
                'page',
                $page->id,
                $targetLocale,
                'page',
                ['title' => $sourcePage['title'] ?? $page->title],
            );
            $this->localization->putValues(
                'page',
                $page->id,
                $targetLocale,
                'wysiwyg',
                ['elements' => $sourceEditor['elements'] ?? []],
            );
            $page->increment('lock_version');
        });

        return response()->json([
            'locale' => $targetLocale,
            'title' => $sourcePage['title'] ?? $page->title,
            'elements' => $sourceEditor['elements'] ?? [],
        ]);
    }

    public function destroyTranslation(Page $page, string $locale): RedirectResponse
    {
        $locale = $this->validatedLocale($locale);

        abort_if(
            $this->localization->isDefault($locale),
            422,
            'The default-language content cannot be deleted.',
        );

        $this->localization->deleteLocaleValues('page', $page->id, $locale);

        return back()->with('success', 'Translation deleted.');
    }

    public function saveWysiwyg(Request $request, Page $page): JsonResponse
    {
        abort_unless($page->content_type === 'wysiwyg', 404);

        $validated = $request->validate([
            'elements' => ['required', 'array'],
            'lock_version' => ['required', 'integer', 'min:0'],
            'locale' => ['nullable', 'string', 'max:35'],
        ]);
        $locale = $this->validatedLocale($validated['locale'] ?? null);

        $updated = Page::query()
            ->whereKey($page->getKey())
            ->where('lock_version', $validated['lock_version'])
            ->update([
                ...($this->localization->isDefault($locale) ? [
                    'draft_elements' => json_encode($validated['elements'], JSON_THROW_ON_ERROR),
                ] : []),
                'lock_version' => DB::raw('lock_version + 1'),
                'updated_at' => now(),
            ]);

        if ($updated === 0) {
            return response()->json([
                'message' => 'This page was updated elsewhere. Refresh before continuing.',
            ], 409);
        }

        if (! $this->localization->isDefault($locale)) {
            $this->localization->putValues(
                'page',
                $page->id,
                $locale,
                'wysiwyg',
                ['elements' => $validated['elements']],
            );
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

    public function editFieldValues(Request $request, Page $page): Response
    {
        abort_unless($page->content_type === 'custom_fields', 404);
        $locale = $this->requestedLocale($request);
        $valuesByLocale = [];
        $titlesByLocale = [];
        $defaultValues = $page->draft_field_values ?? [];
        $sharedValues = $this->nonTranslatableFieldValues(
            $page->field_schema ?? [],
            $defaultValues,
        );

        foreach ($this->localization->languages() as $language) {
            $languageLocale = (string) $language['locale'];
            $valuesByLocale[$languageLocale] = $this->localization->isDefault($languageLocale)
                ? $defaultValues
                : array_merge(
                    $sharedValues,
                    $this->localization->values(
                        'page',
                        $page->id,
                        $languageLocale,
                        'field_values',
                    ),
                );
            $titlesByLocale[$languageLocale] = $this->localization->isDefault($languageLocale)
                ? $page->title
                : ($this->localization->values(
                    'page',
                    $page->id,
                    $languageLocale,
                    'page',
                )['title'] ?? '');
        }

        return Inertia::render('Admin/FieldsEditor', [
            'page' => [
                'id' => $page->id,
                'title' => $page->title,
                'rows' => $page->field_schema ?? [],
                'values' => $valuesByLocale[$locale] ?? [],
                'valuesByLocale' => $valuesByLocale,
                'titlesByLocale' => $titlesByLocale,
            ],
            'languages' => $this->localization->languages(),
            'locale' => $locale,
        ]);
    }

    public function saveFieldValues(
        Request $request,
        Page $page,
    ): RedirectResponse|JsonResponse
    {
        abort_unless($page->content_type === 'custom_fields', 404);

        $validated = $request->validate([
            'values' => ['required', 'array'],
            'locale' => ['nullable', 'string', 'max:35'],
        ]);
        $locale = $this->validatedLocale($validated['locale'] ?? null);

        if ($this->localization->isDefault($locale)) {
            $page->update([
                'draft_field_values' => $validated['values'],
                'lock_version' => $page->lock_version + 1,
            ]);
        } else {
            $this->localization->putValues(
                'page',
                $page->id,
                $locale,
                'field_values',
                $this->translatableFieldValues(
                    $page->field_schema ?? [],
                    $validated['values'],
                ),
            );
            $page->increment('lock_version');
        }

        if ($request->wantsJson()) {
            return response()->json([
                'values' => $this->localization->isDefault($locale)
                    ? ($page->draft_field_values ?? [])
                    : $this->localization->values('page', $page->id, $locale, 'field_values'),
            ]);
        }

        return redirect()->route('terrasphere.admin.content');
    }

    public function updateTitle(Request $request, Page $page): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'locale' => ['nullable', 'string', 'max:35'],
        ]);
        $locale = $this->validatedLocale($validated['locale'] ?? null);

        if ($this->localization->isDefault($locale)) {
            $page->update(['title' => $validated['title']]);
        } else {
            $this->localization->putValues(
                'page',
                $page->id,
                $locale,
                'page',
                ['title' => $validated['title']],
            );
        }

        return redirect()->back()->with('success', 'Page title updated.');
    }

    public function updateSeo(Request $request, Page $page): JsonResponse
    {
        $validated = $request->validate([
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:1000'],
            'focus_keyphrase' => ['nullable', 'string', 'max:255'],
            'canonical_url' => ['nullable', 'url:http,https', 'max:2048'],
            'robots_index' => ['nullable', 'boolean'],
            'robots_follow' => ['nullable', 'boolean'],
            'robots_noarchive' => ['required', 'boolean'],
            'robots_nosnippet' => ['required', 'boolean'],
            'robots_noimageindex' => ['required', 'boolean'],
            'social_title' => ['nullable', 'string', 'max:255'],
            'social_description' => ['nullable', 'string', 'max:1000'],
            'social_image' => ['nullable', 'url:http,https', 'max:2048'],
            'twitter_title' => ['nullable', 'string', 'max:255'],
            'twitter_description' => ['nullable', 'string', 'max:1000'],
            'schema_type' => [
                'nullable',
                Rule::in([
                    'WebPage',
                    'AboutPage',
                    'ContactPage',
                    'CollectionPage',
                    'ItemPage',
                    'FAQPage',
                    'ProfilePage',
                ]),
            ],
            'locale' => ['nullable', 'string', 'max:35'],
        ]);
        $locale = $this->validatedLocale($validated['locale'] ?? null);
        unset($validated['locale']);

        if ($this->localization->isDefault($locale)) {
            $page->update($validated);
        } else {
            $this->localization->putValues('page', $page->id, $locale, 'seo', $validated);
        }

        return response()->json($this->seoData($page, $locale));
    }

    public function editSeo(Request $request, Page $page): Response
    {
        $locale = $this->requestedLocale($request);
        $localizedPage = $this->localization->values('page', $page->id, $locale, 'page');

        return Inertia::render('Admin/PageSeo', [
            'page' => array_merge([
                'id' => $page->id,
                'title' => $this->localization->isDefault($locale)
                    ? $page->title
                    : ($localizedPage['title'] ?? $page->title),
            ], $this->seoData($page, $locale)),
            'languages' => $this->localization->languages(),
            'locale' => $locale,
        ]);
    }

    /**
     * @return array<string, bool|string|null>
     */
    private function seoData(Page $page, ?string $locale = null): array
    {
        $locale ??= $this->localization->defaultLocale();
        $values = $this->localization->isDefault($locale)
            ? $page->getAttributes()
            : $this->localization->values('page', $page->id, $locale, 'seo');

        return [
            'metaTitle' => $values['meta_title'] ?? null,
            'metaDescription' => $values['meta_description'] ?? null,
            'focusKeyphrase' => $values['focus_keyphrase'] ?? null,
            'canonicalUrl' => $values['canonical_url'] ?? null,
            'robotsIndex' => isset($values['robots_index']) ? (bool) $values['robots_index'] : null,
            'robotsFollow' => isset($values['robots_follow']) ? (bool) $values['robots_follow'] : null,
            'robotsNoarchive' => (bool) ($values['robots_noarchive'] ?? false),
            'robotsNosnippet' => (bool) ($values['robots_nosnippet'] ?? false),
            'robotsNoimageindex' => (bool) ($values['robots_noimageindex'] ?? false),
            'socialTitle' => $values['social_title'] ?? null,
            'socialDescription' => $values['social_description'] ?? null,
            'socialImage' => $values['social_image'] ?? null,
            'twitterTitle' => $values['twitter_title'] ?? null,
            'twitterDescription' => $values['twitter_description'] ?? null,
            'schemaType' => $values['schema_type'] ?? null,
        ];
    }

    public function destroy(Page $page): RedirectResponse
    {
        $this->localization->deleteTranslations('page', $page->id);
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
                    $this->localization->deleteTranslations('page', $page->id);
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

    public function publish(Page $page): RedirectResponse
    {
        $page->update([
            'status' => $page->status === 'published' ? 'draft' : 'published',
        ]);

        return redirect()->back()->with(
            'success',
            $page->status === 'published' ? 'Page published.' : 'Page unpublished.'
        );
    }

    private function requestedLocale(Request $request): string
    {
        return $this->validatedLocale($request->query('locale'));
    }

    private function validatedLocale(mixed $locale): string
    {
        $locale = is_string($locale) && $locale !== ''
            ? $locale
            : $this->localization->defaultLocale();

        abort_unless($this->localization->language($locale) !== null, 404);

        return $locale;
    }

    /**
     * @param list<array<string, mixed>> $rows
     * @param array<string, mixed> $values
     * @return array<string, mixed>
     */
    private function translatableFieldValues(array $rows, array $values): array
    {
        $translatable = [];

        foreach ($rows as $row) {
            foreach (($row['fields'] ?? []) as $field) {
                if (($field['translatable'] ?? false) && isset($field['name'])) {
                    $name = (string) $field['name'];
                    if (array_key_exists($name, $values)) {
                        $translatable[$name] = $values[$name];
                    }
                }
            }
        }

        return $translatable;
    }

    /**
     * @param list<array<string, mixed>> $rows
     * @param array<string, mixed> $values
     * @return array<string, mixed>
     */
    private function nonTranslatableFieldValues(array $rows, array $values): array
    {
        $shared = [];

        foreach ($rows as $row) {
            foreach (($row['fields'] ?? []) as $field) {
                if (! ($field['translatable'] ?? false) && isset($field['name'])) {
                    $name = (string) $field['name'];
                    $shared[$name] = $values[$name] ?? null;
                }
            }
        }

        return $shared;
    }
}
