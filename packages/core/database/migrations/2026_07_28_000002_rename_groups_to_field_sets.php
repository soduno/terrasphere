<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('groups', 'field_sets');
    }

    public function down(): void
    {
        Schema::rename('field_sets', 'groups');
    }
};
