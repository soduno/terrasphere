<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')
                ->unique()
                ->constrained()
                ->cascadeOnDelete();
            $table->string('first_name', 100)->nullable();
            $table->string('last_name', 100)->nullable();
            $table->string('display_name', 200)->nullable();
            $table->string('profile_image_path', 2048)->nullable();
            $table->string('cover_image_path', 2048)->nullable();
            $table->text('bio')->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('job_title', 150)->nullable();
            $table->string('organization', 200)->nullable();
            $table->string('location', 200)->nullable();
            $table->string('website_url', 2048)->nullable();
            $table->string('locale', 10)->default('en');
            $table->string('timezone', 64)->default('UTC');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
