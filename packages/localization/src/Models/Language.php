<?php

declare(strict_types=1);

namespace TerraSphere\Localization\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Language extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'native_name',
        'locale',
        'flag',
        'direction',
        'is_default',
        'fallback_language_id',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'position' => 'integer',
        ];
    }

    public function fallbackLanguage(): BelongsTo
    {
        return $this->belongsTo(self::class, 'fallback_language_id');
    }

    public function translations(): HasMany
    {
        return $this->hasMany(LocalizedValue::class);
    }
}
