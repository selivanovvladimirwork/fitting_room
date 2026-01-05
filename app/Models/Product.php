<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = ['name', 'name_ru', 'brand', 'price', 'image_url', 'store_url', 'category_id', 'is_active', 'user_id'];

    protected $casts = ['price' => 'decimal:2', 'is_active' => 'boolean'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
