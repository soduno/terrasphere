<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Query\Expression;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->enum('status', ['draft', 'published', 'archived'])
                ->default('draft')
                ->index();
            $table->json('draft_elements')->default(new Expression('(JSON_ARRAY())'));
            $table->json('published_elements')->nullable();
            $table->unsignedSmallInteger('schema_version')->default(1);
            $table->unsignedInteger('lock_version')->default(0);
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
