<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmtpSetting extends Model
{
    protected $fillable = [
        'host',
        'port',
        'username',
        'password',
        'encryption',
        'from_address',
        'from_name',
    ];

    protected $casts = [
        'port' => 'integer',
        'password' => 'encrypted',
    ];

    /**
     * Получить текущие настройки (singleton pattern)
     */
    public static function current(): ?self
    {
        return static::first();
    }

    /**
     * Получить или создать настройки с дефолтами
     */
    public static function getOrCreate(): self
    {
        return static::firstOrCreate([], [
            'host' => 'smtp.yandex.ru',
            'port' => 465,
            'encryption' => 'ssl',
        ]);
    }
}
