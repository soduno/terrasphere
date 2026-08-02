<?php

declare(strict_types=1);

namespace TerraSphere\Core\Localization;

final class NullLocalizationManager implements LocalizationManager
{
    private const LANGUAGE = [
        'id' => 'default',
        'name' => 'English',
        'nativeName' => 'English',
        'locale' => 'en',
        'flag' => '🇬🇧',
        'direction' => 'ltr',
        'isDefault' => true,
        'fallbackLocale' => null,
    ];

    public function languages(): array
    {
        return [self::LANGUAGE];
    }

    public function language(string $locale): ?array
    {
        return $locale === 'en' ? self::LANGUAGE : null;
    }

    public function defaultLocale(): string
    {
        return 'en';
    }

    public function isDefault(string $locale): bool
    {
        return $locale === 'en';
    }

    public function values(
        string $translatableType,
        string|int $translatableId,
        string $locale,
        string $scope,
        bool $withFallback = false,
        array $defaultValues = [],
    ): array {
        return $withFallback ? $defaultValues : [];
    }

    public function putValues(
        string $translatableType,
        string|int $translatableId,
        string $locale,
        string $scope,
        array $values,
    ): void {
    }

    public function translatedLocales(
        string $translatableType,
        string|int $translatableId,
        array $scopes,
    ): array {
        return [];
    }

    public function translatedLocalesFor(
        string $translatableType,
        array $translatableIds,
        array $scopes,
    ): array {
        return [];
    }

    public function deleteTranslations(
        string $translatableType,
        string|int $translatableId,
    ): void {
    }

    public function deleteLocaleValues(
        string $translatableType,
        string|int $translatableId,
        string $locale,
        array $scopes = [],
    ): void {
    }
}
