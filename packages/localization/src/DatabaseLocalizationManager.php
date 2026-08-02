<?php

declare(strict_types=1);

namespace TerraSphere\Localization;

use TerraSphere\Core\Localization\LocalizationManager;
use TerraSphere\Localization\Models\Language;
use TerraSphere\Localization\Models\LocalizedValue;

final class DatabaseLocalizationManager implements LocalizationManager
{
    public function languages(): array
    {
        return Language::query()
            ->with('fallbackLanguage:id,locale')
            ->orderByDesc('is_default')
            ->orderBy('position')
            ->orderBy('name')
            ->get()
            ->map(fn (Language $language): array => $this->serialize($language))
            ->all();
    }

    public function language(string $locale): ?array
    {
        $language = Language::query()
            ->with('fallbackLanguage:id,locale')
            ->where('locale', $locale)
            ->first();

        return $language ? $this->serialize($language) : null;
    }

    public function defaultLocale(): string
    {
        return (string) Language::query()
            ->where('is_default', true)
            ->value('locale');
    }

    public function isDefault(string $locale): bool
    {
        return Language::query()
            ->where('locale', $locale)
            ->where('is_default', true)
            ->exists();
    }

    public function values(
        string $translatableType,
        string|int $translatableId,
        string $locale,
        string $scope,
        bool $withFallback = false,
        array $defaultValues = [],
    ): array {
        $language = Language::query()
            ->with('fallbackLanguage')
            ->where('locale', $locale)
            ->first();

        if (! $language) {
            return [];
        }

        if ($language->is_default) {
            $values = $this->directValues(
                $language,
                $translatableType,
                $translatableId,
                $scope,
            );

            return $values !== [] ? $values : ($withFallback ? $defaultValues : []);
        }

        $visited = [];

        while ($language && ! isset($visited[$language->id])) {
            $visited[$language->id] = true;
            $values = $this->directValues(
                $language,
                $translatableType,
                $translatableId,
                $scope,
            );

            if ($values !== [] || ! $withFallback) {
                return $values;
            }

            $language = $language->fallbackLanguage;
            if ($language?->is_default) {
                $values = $this->directValues(
                    $language,
                    $translatableType,
                    $translatableId,
                    $scope,
                );

                return $values !== [] ? $values : $defaultValues;
            }

            $language?->loadMissing('fallbackLanguage');
        }

        return [];
    }

    public function putValues(
        string $translatableType,
        string|int $translatableId,
        string $locale,
        string $scope,
        array $values,
    ): void {
        $language = Language::query()->where('locale', $locale)->firstOrFail();

        $key = [
            'language_id' => $language->id,
            'translatable_type' => $translatableType,
            'translatable_id' => (string) $translatableId,
            'scope' => $scope,
        ];

        if ($values === []) {
            LocalizedValue::query()->where($key)->delete();

            return;
        }

        LocalizedValue::query()->updateOrCreate(
            $key,
            ['values' => $values],
        );
    }

    public function translatedLocales(
        string $translatableType,
        string|int $translatableId,
        array $scopes,
    ): array {
        return LocalizedValue::query()
            ->join('languages', 'languages.id', '=', 'localized_values.language_id')
            ->where('translatable_type', $translatableType)
            ->where('translatable_id', (string) $translatableId)
            ->whereIn('scope', $scopes)
            ->where('values', '!=', '{}')
            ->distinct()
            ->pluck('languages.locale')
            ->all();
    }

    public function translatedLocalesFor(
        string $translatableType,
        array $translatableIds,
        array $scopes,
    ): array {
        if ($translatableIds === []) {
            return [];
        }

        $statuses = [];
        $rows = LocalizedValue::query()
            ->join('languages', 'languages.id', '=', 'localized_values.language_id')
            ->where('translatable_type', $translatableType)
            ->whereIn('translatable_id', array_map('strval', $translatableIds))
            ->whereIn('scope', $scopes)
            ->where('values', '!=', '{}')
            ->distinct()
            ->get(['localized_values.translatable_id', 'languages.locale']);

        foreach ($rows as $row) {
            $id = (string) $row->translatable_id;
            $statuses[$id] ??= [];
            $statuses[$id][] = (string) $row->locale;
        }

        return $statuses;
    }

    public function deleteTranslations(
        string $translatableType,
        string|int $translatableId,
    ): void {
        LocalizedValue::query()
            ->where('translatable_type', $translatableType)
            ->where('translatable_id', (string) $translatableId)
            ->delete();
    }

    public function deleteLocaleValues(
        string $translatableType,
        string|int $translatableId,
        string $locale,
        array $scopes = [],
    ): void {
        $languageId = Language::query()->where('locale', $locale)->value('id');
        if (! $languageId) {
            return;
        }

        $query = LocalizedValue::query()
            ->where('language_id', $languageId)
            ->where('translatable_type', $translatableType)
            ->where('translatable_id', (string) $translatableId);

        if ($scopes !== []) {
            $query->whereIn('scope', $scopes);
        }

        $query->delete();
    }

    /** @return array<string, mixed> */
    private function directValues(
        Language $language,
        string $translatableType,
        string|int $translatableId,
        string $scope,
    ): array {
        $localizedValue = LocalizedValue::query()
            ->where('language_id', $language->id)
            ->where('translatable_type', $translatableType)
            ->where('translatable_id', (string) $translatableId)
            ->where('scope', $scope)
            ->first();

        return $localizedValue?->values ?? [];
    }

    /** @return array<string, bool|string|null> */
    private function serialize(Language $language): array
    {
        return [
            'id' => $language->id,
            'name' => $language->name,
            'nativeName' => $language->native_name,
            'locale' => $language->locale,
            'flag' => $language->flag,
            'direction' => $language->direction,
            'isDefault' => $language->is_default,
            'fallbackLocale' => $language->fallbackLanguage?->locale,
        ];
    }
}
