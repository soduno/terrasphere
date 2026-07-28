<?php

declare(strict_types=1);

namespace TerraSphere\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class UserProfile extends Model
{
    protected $table = 'user_profiles';

    protected $fillable = [
        'first_name',
        'last_name',
        'display_name',
        'profile_image_path',
        'cover_image_path',
        'bio',
        'phone',
        'job_title',
        'organization',
        'location',
        'website_url',
        'locale',
        'timezone',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
