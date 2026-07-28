<?php

declare(strict_types=1);

namespace TerraSphere\Core\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use TerraSphere\Core\Models\UserProfile;

final class ProfileController
{
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->profile;

        return Inertia::render('Admin/Profile', [
            'profile' => $profile ? [
                'first_name' => $profile->first_name,
                'last_name' => $profile->last_name,
                'bio' => $profile->bio,
                'profile_image_path' => $profile->profile_image_path,
            ] : [
                'first_name' => null,
                'last_name' => null,
                'bio' => null,
                'profile_image_path' => null,
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'bio' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();

        $profile = UserProfile::query()->updateOrCreate(
            ['user_id' => $user->getKey()],
            [
                'first_name' => $validated['first_name'] ?? null,
                'last_name' => $validated['last_name'] ?? null,
                'bio' => $validated['bio'] ?? null,
            ],
        );

        if ($request->wantsJson()) {
            return response()->json([
                'profile' => [
                    'first_name' => $profile->first_name,
                    'last_name' => $profile->last_name,
                    'bio' => $profile->bio,
                    'profile_image_path' => $profile->profile_image_path,
                ],
            ]);
        }

        return back()->with('success', 'Profile updated successfully.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => $validated['new_password'],
        ]);

        return back()->with('success', 'Password updated successfully.');
    }
}
