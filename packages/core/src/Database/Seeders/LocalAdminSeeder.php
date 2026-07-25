<?php

declare(strict_types=1);

namespace TerraSphere\Core\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use TerraSphere\Core\Models\User;

final class LocalAdminSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'development', 'testing'])) {
            throw new RuntimeException('The local admin seeder cannot run in this environment.');
        }

        DB::transaction(function (): void {
            $now = now();
            $user = User::query()
                ->withTrashed()
                ->firstOrNew(['email' => 'mail@simonduun.com']);

            $user->forceFill([
                'username' => 'simonduun',
                'password' => '1234',
                'status' => 'active',
                'email_verified_at' => $now,
                'password_changed_at' => $now,
                'deleted_at' => null,
            ])->save();

            DB::table('user_profiles')->updateOrInsert(
                ['user_id' => $user->getKey()],
                [
                    'first_name' => 'Simon',
                    'last_name' => 'Duun',
                    'display_name' => 'Simon Duun',
                    'profile_image_path' => null,
                    'cover_image_path' => null,
                    'bio' => null,
                    'phone' => null,
                    'job_title' => null,
                    'organization' => null,
                    'location' => 'Denmark',
                    'website_url' => null,
                    'locale' => 'da',
                    'timezone' => 'Europe/Copenhagen',
                    'created_at' => $user->created_at ?? $now,
                    'updated_at' => $now,
                ],
            );

            DB::table('user_settings')->updateOrInsert(
                ['user_id' => $user->getKey()],
                [
                    'settings' => json_encode([], JSON_THROW_ON_ERROR),
                    'schema_version' => 1,
                    'created_at' => $user->created_at ?? $now,
                    'updated_at' => $now,
                ],
            );
        });
    }
}
