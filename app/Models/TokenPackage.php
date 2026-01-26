<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TokenPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'tokens',
        'price',
        'currency',
        'is_active',
    ];

    protected $casts = [
        'tokens' => 'integer',
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];
}
