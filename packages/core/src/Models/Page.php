<?php

declare(strict_types=1);

namespace TerraSphere\Core\Models;

use Illuminate\Database\Eloquent\Model;

final class Page extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'meta_title',
        'meta_description',
        'focus_keyphrase',
        'canonical_url',
        'robots_index',
        'robots_follow',
        'robots_noarchive',
        'robots_nosnippet',
        'robots_noimageindex',
        'social_title',
        'social_description',
        'social_image',
        'schema_type',
        'content_type',
        'status',
        'draft_elements',
        'published_elements',
        'field_schema',
        'draft_field_values',
        'published_field_values',
        'schema_version',
        'lock_version',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'draft_elements' => 'array',
            'published_elements' => 'array',
            'field_schema' => 'array',
            'draft_field_values' => 'array',
            'published_field_values' => 'array',
            'robots_index' => 'boolean',
            'robots_follow' => 'boolean',
            'robots_noarchive' => 'boolean',
            'robots_nosnippet' => 'boolean',
            'robots_noimageindex' => 'boolean',
            'published_at' => 'datetime',
        ];
    }
}
