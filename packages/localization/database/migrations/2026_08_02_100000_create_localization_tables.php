<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('languages', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('native_name');
            $table->string('locale', 35)->unique();
            $table->string('flag', 32);
            $table->enum('direction', ['ltr', 'rtl'])->default('ltr');
            $table->boolean('is_default')->default(false)->index();
            $table->foreignUuid('fallback_language_id')
                ->nullable()
                ->constrained('languages')
                ->nullOnDelete();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('localized_values', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('language_id')
                ->constrained('languages')
                ->cascadeOnDelete();
            $table->string('translatable_type', 100);
            $table->string('translatable_id', 64);
            $table->string('scope', 64);
            $table->json('values');
            $table->timestamps();

            $table->unique(
                ['language_id', 'translatable_type', 'translatable_id', 'scope'],
                'localized_values_owner_unique',
            );
            $table->index(
                ['translatable_type', 'translatable_id'],
                'localized_values_owner_index',
            );
        });

        DB::table('languages')->insert([
            'id' => (string) Str::uuid(),
            'name' => 'English',
            'native_name' => 'English',
            'locale' => 'en',
            'flag' => '🇬🇧',
            'direction' => 'ltr',
            'is_default' => true,
            'position' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('localized_values');
        Schema::dropIfExists('languages');
    }
};
