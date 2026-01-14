<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DigitalTwinImage extends Model
{
    protected $fillable = ['digital_twin_id', 'image_url', 'sort_order'];

    public function digitalTwin(): BelongsTo
    {
        return $this->belongsTo(DigitalTwin::class);
    }
}
