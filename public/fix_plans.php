<?php

/**
 * Emergency Plan Update Script
 * Visit this in your browser: https://fittingadmin.loc/fix_plans.php
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

use App\Models\SubscriptionPlan;
use Illuminate\Contracts\Console\Kernel;

$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

try {
    echo "<h1>Обновление тарифных планов...</h1>";
    
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
            'price' => 449, 
            'period' => 'month',
            'features' => ['50 токенов в месяц', 'Безлимитные двойники', 'Все сценарии', 'Ранний доступ к фичам'],
            'twins_limit' => 99,
            'photos_per_day' => 50,
            'videos_per_day' => 5,
            'video_quality' => 'hd',
            'is_active' => true,
            'sort_order' => 2,
        ],
        [
            'name' => 'ELITE',
            'price' => 990,
            'period' => 'month',
            'features' => ['200 токенов в месяц', '200 фото или 40 видео', 'Приоритетная генерация', 'Ранний доступ к фичам'],
            'twins_limit' => 999,
            'photos_per_day' => 200,
            'videos_per_day' => 15,
            'video_quality' => '4k',
            'is_active' => true,
            'sort_order' => 3,
        ],
    ];

    foreach ($plans as $plan) {
        $result = SubscriptionPlan::updateOrCreate(
            ['sort_order' => $plan['sort_order']],
            $plan
        );
        echo "<p>Обновлен план: <b>{$plan['name']}</b> (Порядок: {$plan['sort_order']})</p>";
    }

    echo "<h2 style='color: green;'>Успешно! Теперь проверьте страницу подписок.</h2>";
    echo "<p><a href='https://fittingroom.loc/subscription'>Перейти на страницу подписок</a></p>";

} catch (\Exception $e) {
    echo "<h2 style='color: red;'>Ошибка: " . $e->getMessage() . "</h2>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
