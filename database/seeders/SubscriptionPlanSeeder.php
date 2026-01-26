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
                'name' => 'БАЗОВЫЙ',
                'price' => 0,
                'period' => 'month',
                'features' => ['10 токенов в месяц', '1 токен = 1 фото', '5 токенов = 1 видео', '1 Цифровой двойник', 'Базовые сценарии'],
                'twins_limit' => 1,
                'photos_per_day' => 10,
                'videos_per_day' => 0,
                'video_quality' => 'low',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'PROFESSIONAL',
                'price' => 1490, 
                'period' => 'month',
                'features' => ['50 токенов в месяц', 'Безлимитные двойники', 'HD видео (Google Veo)', 'Все сценарии', 'Приоритетная генерация'],
                'twins_limit' => 99,
                'photos_per_day' => 50,
                'videos_per_day' => 5,
                'video_quality' => 'hd',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'ELITE',
                'price' => 4990,
                'period' => 'month',
                'features' => ['200 токенов в месяц', '200 фото или 40 видео', '4K видео генерация', 'Персональная LoRA тюнинг', 'Ранний доступ к фичам', 'Скрытые водяные знаки'],
                'twins_limit' => 999,
                'photos_per_day' => 200,
                'videos_per_day' => 15,
                'video_quality' => '4k',
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['sort_order' => $plan['sort_order']],
                $plan
            );
        }
    }
}
