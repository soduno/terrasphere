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
            $table->enum('content_type', ['wysiwyg', 'custom_fields'])
                ->default('wysiwyg')
                ->after('slug')
                ->index();
            $table->json('field_schema')->nullable()->after('published_elements');
            $table->json('draft_field_values')->nullable()->after('field_schema');
            $table->json('published_field_values')->nullable()->after('draft_field_values');
        });
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table): void {
            $table->dropIndex(['content_type']);
            $table->dropColumn([
                'content_type',
                'field_schema',
                'draft_field_values',
                'published_field_values',
            ]);
        });
    }
};
