<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiApiSetting extends Model
{
    protected $fillable = [
        'photo_api_key',
        'video_api_key',
        'photo_tokens_used',
        'video_tokens_used',
        'photo_tokens_limit',
        'video_tokens_limit',
    ];

    protected $casts = [
        'photo_tokens_used' => 'integer',
        'video_tokens_used' => 'integer',
        'photo_tokens_limit' => 'integer',
        'video_tokens_limit' => 'integer',
    ];

    public static function getInstance(): self
    {
        return self::firstOrCreate(['id' => 1]);
    }
}
