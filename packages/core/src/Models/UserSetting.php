<?php

declare(strict_types=1);

namespace TerraSphere\Core\Models;

use Illuminate\Database\Eloquent\Model;

final class UserSetting extends Model
{
    protected $fillable = [
        'user_id',
        'settings',
        'schema_version',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'schema_version' => 'integer',
        ];
    }
}
