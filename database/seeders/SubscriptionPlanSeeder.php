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
                'name' => 'Базовый',
                'price' => 0,
                'period' => 'month',
                'features' => ['1 Цифровой двойник', '10 примерок в день', 'Низкое разрешение', 'Базовые сценарии'],
                'twins_limit' => 1,
                'photos_per_day' => 10,
                'video_quality' => 'low',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Professional',
                'price' => 1490,
                'period' => 'month',
                'features' => ['Безлимитные двойники', 'HD видео (Google Veo)', 'Все 4 сценария ходьбы', 'Приоритетная генерация', 'Visual Search поиск'],
                'twins_limit' => 999,
                'photos_per_day' => 999,
                'video_quality' => 'hd',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Elite',
                'price' => 4990,
                'period' => 'month',
                'features' => ['4K видео генерация', 'API доступ', 'Персональный LoRA тюнинг', 'Скрытые водяные знаки', 'Ранний доступ к фичам'],
                'twins_limit' => 999,
                'photos_per_day' => 999,
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
