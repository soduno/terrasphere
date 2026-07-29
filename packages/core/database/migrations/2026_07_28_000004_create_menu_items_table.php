<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('menu_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('menu_items')->cascadeOnDelete();
            $table->string('type'); // page | custom
            $table->foreignId('page_id')->nullable()->constrained()->nullOnDelete();
            $table->string('url')->nullable();
            $table->string('label');
            $table->string('css_classes')->nullable();
            $table->string('target')->default('_self');
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
