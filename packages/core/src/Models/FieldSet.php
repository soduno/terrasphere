<?php

declare(strict_types=1);

namespace TerraSphere\Core\Models;

use Illuminate\Database\Eloquent\Model;

final class FieldSet extends Model
{
    protected $table = 'field_sets';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'field_schema',
    ];

    protected function casts(): array
    {
        return [
            'field_schema' => 'array',
        ];
    }
}
