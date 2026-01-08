<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'post_ids',
    ];

    protected $casts = [
        'post_ids' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
