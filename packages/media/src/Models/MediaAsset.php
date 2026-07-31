<?php

declare(strict_types=1);

namespace TerraSphere\Media\Models;

use Illuminate\Database\Eloquent\Model;

final class MediaAsset extends Model
{
    protected $fillable = [
        'uuid',
        'disk',
        'path',
        'filename',
        'display_name',
        'mime_type',
        'size',
        'width',
        'height',
        'uploaded_by',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function displayName(): string
    {
        return $this->display_name ?: $this->filename;
    }
}
