<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'name',
        'price',
        'period',
        'features',
        'twins_limit',
        'photos_per_day',
        'videos_per_day',
        'video_quality',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'features' => 'array',
        'twins_limit' => 'integer',
        'photos_per_day' => 'integer',
        'videos_per_day' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
