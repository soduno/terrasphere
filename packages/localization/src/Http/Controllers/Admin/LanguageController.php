<?php

declare(strict_types=1);

namespace TerraSphere\Localization\Http\Controllers\Admin;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use TerraSphere\Core\Localization\LocalizationManager;
use TerraSphere\Localization\DefaultLanguageSwitcher;
use TerraSphere\Localization\Models\Language;

final class LanguageController
{
    public function index(LocalizationManager $localization): Response
    {
        return Inertia::render('Localization/Admin/Index', [
            'languages' => $localization->languages(),
        ]);
    }

    public function store(
        Request $request,
        DefaultLanguageSwitcher $defaultLanguageSwitcher,
    ): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        DB::transaction(function () use ($validated, $defaultLanguageSwitcher): void {
            $isDefault = (bool) ($validated['is_default'] ?? false)
                || ! Language::query()->where('is_default', true)->exists();

            $language = Language::query()->create([
                ...$this->attributes($validated),
                'is_default' => false,
                'position' => (int) Language::query()->max('position') + 1,
            ]);

            if ($isDefault) {
                $defaultLanguageSwitcher->switchTo($language);
            }
        });

        return back()->with('success', 'Language installed.');
    }

    public function update(
        Request $request,
        Language $language,
        DefaultLanguageSwitcher $defaultLanguageSwitcher,
    ): RedirectResponse
    {
        $validated = $request->validate($this->rules($language));

        DB::transaction(function () use (
            $language,
            $validated,
            $defaultLanguageSwitcher,
        ): void {
            $isDefault = (bool) ($validated['is_default'] ?? false);

            $language->update([
                ...$this->attributes($validated),
            ]);

            if ($isDefault && ! $language->is_default) {
                $defaultLanguageSwitcher->switchTo($language);
            }
        });

        return back()->with('success', 'Language updated.');
    }

    public function destroy(Language $language): RedirectResponse
    {
        if ($language->is_default) {
            return back()->withErrors([
                'language' => 'Choose another default language before removing this one.',
            ]);
        }

        $language->delete();

        return back()->with('success', 'Language removed.');
    }

    public function destroyMany(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'uuid', 'distinct', 'exists:languages,id'],
        ]);

        if (Language::query()
            ->whereKey($validated['ids'])
            ->where('is_default', true)
            ->exists()) {
            return back()->withErrors([
                'language' => 'The default language cannot be removed.',
            ]);
        }

        Language::query()->whereKey($validated['ids'])->delete();

        return back()->with('success', 'Selected languages removed.');
    }

    /** @return array<string, mixed> */
    private function rules(?Language $language = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'native_name' => ['required', 'string', 'max:255'],
            'locale' => [
                'required',
                'string',
                'max:35',
                'regex:/^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$/',
                Rule::unique('languages', 'locale')->ignore($language),
            ],
            'flag' => ['required', 'string', 'max:32'],
            'direction' => ['required', Rule::in(['ltr', 'rtl'])],
            'fallback_language_id' => [
                'nullable',
                'uuid',
                Rule::exists('languages', 'id'),
                Rule::notIn($language ? [$language->id] : []),
            ],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }

    /** @param array<string, mixed> $validated */
    private function attributes(array $validated): array
    {
        return [
            'name' => $validated['name'],
            'native_name' => $validated['native_name'],
            'locale' => $validated['locale'],
            'flag' => $validated['flag'],
            'direction' => $validated['direction'],
            'fallback_language_id' => $validated['fallback_language_id'] ?? null,
        ];
    }
}
