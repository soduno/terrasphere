<?php

declare(strict_types=1);

namespace TerraSphere\Localization\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class LocalizedValue extends Model
{
    use HasUuids;

    protected $fillable = [
        'language_id',
        'translatable_type',
        'translatable_id',
        'scope',
        'values',
    ];

    protected function casts(): array
    {
        return ['values' => 'array'];
    }

    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }
}
