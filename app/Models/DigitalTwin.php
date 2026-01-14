<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DigitalTwin extends Model
{
    protected $fillable = ['user_id', 'name', 'image_url', 'generated_avatar_url', 'height', 'weight', 'chest', 'waist', 'hips'];

    protected $casts = ['height' => 'integer', 'weight' => 'integer', 'chest' => 'integer', 'waist' => 'integer', 'hips' => 'integer'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(DigitalTwinImage::class)->orderBy('sort_order');
    }
}
