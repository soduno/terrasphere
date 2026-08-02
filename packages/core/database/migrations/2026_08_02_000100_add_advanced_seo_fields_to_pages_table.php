<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table): void {
            $table->string('focus_keyphrase')->nullable()->after('meta_description');
            $table->string('canonical_url', 2048)->nullable()->after('focus_keyphrase');
            $table->boolean('robots_index')->nullable()->after('canonical_url');
            $table->boolean('robots_follow')->nullable()->after('robots_index');
            $table->boolean('robots_noarchive')->default(false)->after('robots_follow');
            $table->boolean('robots_nosnippet')->default(false)->after('robots_noarchive');
            $table->boolean('robots_noimageindex')->default(false)->after('robots_nosnippet');
            $table->string('social_title')->nullable()->after('robots_noimageindex');
            $table->text('social_description')->nullable()->after('social_title');
            $table->string('social_image', 2048)->nullable()->after('social_description');
            $table->string('schema_type')->nullable()->after('social_image');
        });
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table): void {
            $table->dropColumn([
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
                'schema_type',
            ]);
        });
    }
};
