<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'БАЗОВЫЙ (Trial)',
                'price' => 0,
                'period' => 'month',
                'features' => ['10 токенов (Бонус при регистрации)', '1 токен = 1 фото', '5 токенов = 1 видео', 'Базовые сценарии'],
                'twins_limit' => 1,
                'photos_per_day' => 10, // Legacy field, logic moved to tokens
                'videos_per_day' => 0,
                'video_quality' => 'low',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'СТАРТОВЫЙ (Standard)',
                'price' => 490, // Was 490 -> 50 tokens
                'period' => 'month',
                'features' => ['50 токенов / месяц', 'Эквивалент: ~50 фото или 10 видео', 'Безлимитные двойники', 'HD качество', 'Приоритет'],
                'twins_limit' => 99,
                'photos_per_day' => 50, // Used as token grant amount in mock
                'videos_per_day' => 5,
                'video_quality' => 'hd',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'ПРОФЕССИОНАЛЬНЫЙ (Pro)',
                'price' => 990, // Was 990 -> 200 tokens
                'period' => 'month',
                'features' => ['200 токенов / месяц', 'Эквивалент: ~200 фото или 40 видео', '4K Video генерация', 'Ранний доступ', 'Персональная поддержка'],
                'twins_limit' => 999,
                'photos_per_day' => 200, // Used as token grant amount in mock
                'videos_per_day' => 15,
                'video_quality' => '4k',
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['name' => $plan['name']],
                $plan
            );
        }
    }
}
