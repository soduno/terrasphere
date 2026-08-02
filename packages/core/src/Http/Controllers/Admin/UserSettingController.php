<?php

declare(strict_types=1);

namespace TerraSphere\Core\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use TerraSphere\Core\Models\UserSetting;

final class UserSettingController
{
    private const PROPERTY_SECTIONS = [
        'attributes',
        'spacing',
        'horizontal-alignment',
        'vertical-alignment',
        'layout',
        'typography',
        'appearance',
        'image',
        'float',
    ];

    public function updateEditorPropertyOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'property_section_order' => ['required', 'array', 'max:9'],
            'property_section_order.*' => [
                'required',
                'string',
                'distinct',
                Rule::in(self::PROPERTY_SECTIONS),
            ],
        ]);

        $user = $request->user();
        $userSetting = UserSetting::query()->firstOrNew(['user_id' => $user->getKey()]);
        $settings = $userSetting->settings ?? [];
        $settings['editor'] = [
            ...($settings['editor'] ?? []),
            'property_section_order' => $validated['property_section_order'],
        ];

        $userSetting->fill([
            'settings' => $settings,
            'schema_version' => 1,
        ])->save();

        return response()->json([
            'propertySectionOrder' => $validated['property_section_order'],
        ]);
    }
}
