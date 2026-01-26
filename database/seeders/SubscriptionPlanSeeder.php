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
                'features' => ['10 фото при регистрации (Бонус)', '1 Цифровой двойник', 'Базовые сценарии ходьбы'],
                'twins_limit' => 1,
                'photos_per_day' => 10,
                'videos_per_day' => 0,
                'video_quality' => 'low',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'СТАРТОВЫЙ (Standard)',
                'price' => 490,
                'period' => 'month',
                'features' => ['30 фото / месяц', '5 видео / месяц', 'Безлимитное хранение двойников', 'HD разрешение (720p)', 'Приоритетная очередь'],
                'twins_limit' => 99,
                'photos_per_day' => 30,
                'videos_per_day' => 5,
                'video_quality' => 'hd',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'ПРОФЕССИОНАЛЬНЫЙ (Pro)',
                'price' => 990,
                'period' => 'month',
                'features' => ['75 фото / месяц', '15 видео / месяц', 'Ранний доступ к новым фичам (Beta)', 'Максимальное качество (4K)', 'Персональная поддержка'],
                'twins_limit' => 999,
                'photos_per_day' => 75,
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
