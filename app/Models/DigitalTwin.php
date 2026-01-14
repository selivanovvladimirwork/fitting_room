<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DigitalTwin extends Model
{
    protected $fillable = ['user_id', 'name', 'image_url', 'generated_avatar_url', 'height', 'weight', 'chest', 'waist', 'hips'];

    protected $casts = ['height' => 'integer', 'weight' => 'integer', 'chest' => 'integer', 'waist' => 'integer', 'hips' => 'integer'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
