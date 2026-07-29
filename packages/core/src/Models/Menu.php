<?php

declare(strict_types=1);

namespace TerraSphere\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Menu extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'location',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(MenuItem::class)->orderBy('order');
    }

    public function rootItems(): HasMany
    {
        return $this->hasMany(MenuItem::class)->whereNull('parent_id')->orderBy('order');
    }
}
