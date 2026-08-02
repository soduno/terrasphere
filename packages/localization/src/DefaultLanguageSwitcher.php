<?php

declare(strict_types=1);

namespace TerraSphere\Localization;

use Illuminate\Support\Facades\DB;
use TerraSphere\Core\Models\Page;
use TerraSphere\Localization\Models\Language;
use TerraSphere\Localization\Models\LocalizedValue;

final class DefaultLanguageSwitcher
{
    private const SEO_FIELDS = [
        'meta_title',
        'meta_description',
        'focus_keyphrase',
        'canonical_url',
        'robots_index',
        'robots_follow',
        'robots_noarchive',
        'robots_nosnippet',
        'robots_noimageindex',
        'social_title',
        'social_description',
        'social_image',
        'twitter_title',
        'twitter_description',
        'schema_type',
    ];

    public function switchTo(Language $newDefault): void
    {
        DB::transaction(function () use ($newDefault): void {
            $oldDefault = Language::query()
                ->where('is_default', true)
                ->whereKeyNot($newDefault->getKey())
                ->first();

            if (! $oldDefault) {
                Language::query()->whereKeyNot($newDefault->getKey())->update([
                    'is_default' => false,
                ]);
                $newDefault->update([
                    'is_default' => true,
                    'fallback_language_id' => null,
                ]);

                return;
            }

            Page::query()->chunkById(100, function ($pages) use ($oldDefault, $newDefault): void {
                foreach ($pages as $page) {
                    $this->storeCurrentDefault($page, $oldDefault);
                    $this->promoteNewDefault($page, $newDefault);
                }
            });

            Language::query()->whereKeyNot($newDefault->getKey())->update([
                'is_default' => false,
            ]);
            $newDefault->update([
                'is_default' => true,
                'fallback_language_id' => null,
            ]);
        });
    }

    private function storeCurrentDefault(Page $page, Language $language): void
    {
        $this->put($page, $language, 'page', ['title' => $page->title]);

        if ($page->content_type === 'wysiwyg') {
            $this->put($page, $language, 'wysiwyg', [
                'elements' => $page->draft_elements ?? [],
            ]);
        } else {
            $this->put(
                $page,
                $language,
                'field_values',
                $this->fieldValues($page, translatable: true),
            );
        }

        $this->put($page, $language, 'seo', array_intersect_key(
            $page->getAttributes(),
            array_flip(self::SEO_FIELDS),
        ));
    }

    private function promoteNewDefault(Page $page, Language $language): void
    {
        $pageValues = $this->values($page, $language, 'page');
        $updates = ['title' => $pageValues['title'] ?? $page->title];

        if ($page->content_type === 'wysiwyg') {
            $editorValues = $this->values($page, $language, 'wysiwyg');
            $updates['draft_elements'] = $editorValues['elements'] ?? [];
        } else {
            $updates['draft_field_values'] = array_merge(
                $this->fieldValues($page, translatable: false),
                $this->values($page, $language, 'field_values'),
            );
        }

        $seoValues = $this->values($page, $language, 'seo');
        foreach (self::SEO_FIELDS as $field) {
            $updates[$field] = $seoValues[$field]
                ?? (str_starts_with($field, 'robots_no') ? false : null);
        }

        $page->update($updates);

        LocalizedValue::query()
            ->where('language_id', $language->id)
            ->where('translatable_type', 'page')
            ->where('translatable_id', (string) $page->id)
            ->delete();
    }

    /** @param array<string, mixed> $values */
    private function put(
        Page $page,
        Language $language,
        string $scope,
        array $values,
    ): void {
        if ($values === []) {
            return;
        }

        LocalizedValue::query()->updateOrCreate([
            'language_id' => $language->id,
            'translatable_type' => 'page',
            'translatable_id' => (string) $page->id,
            'scope' => $scope,
        ], ['values' => $values]);
    }

    /** @return array<string, mixed> */
    private function values(Page $page, Language $language, string $scope): array
    {
        return LocalizedValue::query()
            ->where('language_id', $language->id)
            ->where('translatable_type', 'page')
            ->where('translatable_id', (string) $page->id)
            ->where('scope', $scope)
            ->first()?->values ?? [];
    }

    /** @return array<string, mixed> */
    private function fieldValues(Page $page, bool $translatable): array
    {
        $values = $page->draft_field_values ?? [];
        $selected = [];

        foreach (($page->field_schema ?? []) as $row) {
            foreach (($row['fields'] ?? []) as $field) {
                if (
                    (bool) ($field['translatable'] ?? false) === $translatable
                    && isset($field['name'])
                ) {
                    $name = (string) $field['name'];
                    if (array_key_exists($name, $values)) {
                        $selected[$name] = $values[$name];
                    }
                }
            }
        }

        return $selected;
    }
}
