<?php

declare(strict_types=1);

namespace TerraSphere\Core\Localization;

interface LocalizationManager
{
    /**
     * @return list<array{
     *     id: string,
     *     name: string,
     *     nativeName: string,
     *     locale: string,
     *     flag: string,
     *     direction: string,
     *     isDefault: bool,
     *     fallbackLocale: string|null
     * }>
     */
    public function languages(): array;

    /** @return array<string, bool|string|null>|null */
    public function language(string $locale): ?array;

    public function defaultLocale(): string;

    public function isDefault(string $locale): bool;

    /**
     * @param array<string, mixed> $defaultValues
     * @return array<string, mixed>
     */
    public function values(
        string $translatableType,
        string|int $translatableId,
        string $locale,
        string $scope,
        bool $withFallback = false,
        array $defaultValues = [],
    ): array;

    /** @param array<string, mixed> $values */
    public function putValues(
        string $translatableType,
        string|int $translatableId,
        string $locale,
        string $scope,
        array $values,
    ): void;

    /** @return list<string> */
    public function translatedLocales(
        string $translatableType,
        string|int $translatableId,
        array $scopes,
    ): array;

    /**
     * @param list<string|int> $translatableIds
     * @param list<string> $scopes
     * @return array<string, list<string>>
     */
    public function translatedLocalesFor(
        string $translatableType,
        array $translatableIds,
        array $scopes,
    ): array;

    public function deleteTranslations(
        string $translatableType,
        string|int $translatableId,
    ): void;

    /** @param list<string> $scopes */
    public function deleteLocaleValues(
        string $translatableType,
        string|int $translatableId,
        string $locale,
        array $scopes = [],
    ): void;
}
