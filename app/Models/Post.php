<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    protected $fillable = ['user_id', 'product_id', 'title', 'image_url', 'author_name', 'likes', 'is_private', 'tags'];

    protected $casts = ['likes' => 'integer', 'is_private' => 'boolean', 'tags' => 'array'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

