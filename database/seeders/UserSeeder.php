<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Создание тестовых пользователей для имитации активности
     */
    public function run(): void
    {
        $users = [
            ['name' => 'Vogue Edge', 'nickname' => 'vogue_edge', 'email' => 'vogue@example.com', 'bio' => 'Минимализм и элегантность'],
            ['name' => 'Urban Knight', 'nickname' => 'urban_knight', 'email' => 'urban@example.com', 'bio' => 'Techwear энтузиаст'],
            ['name' => 'Luxe Daily', 'nickname' => 'luxe_daily', 'email' => 'luxe@example.com', 'bio' => 'Роскошь каждый день'],
            ['name' => 'Nordic Style', 'nickname' => 'nordic_style', 'email' => 'nordic@example.com', 'bio' => 'Скандинавская простота'],
            ['name' => 'Office Chic', 'nickname' => 'office_chic', 'email' => 'office@example.com', 'bio' => 'Деловой стиль'],
            ['name' => 'Denim Cult', 'nickname' => 'denim_cult', 'email' => 'denim@example.com', 'bio' => 'Джинсовая культура'],
            ['name' => 'Fit Life', 'nickname' => 'fit_life', 'email' => 'fit@example.com', 'bio' => 'Спорт и стиль'],
            ['name' => 'Autumn Vibes', 'nickname' => 'autumn_vibes', 'email' => 'autumn@example.com', 'bio' => 'Осенние образы'],
            ['name' => 'Boho Soul', 'nickname' => 'boho_soul', 'email' => 'boho@example.com', 'bio' => 'Богемный шик'],
            ['name' => 'Street God', 'nickname' => 'street_god', 'email' => 'street@example.com', 'bio' => 'Уличная мода'],
            ['name' => 'Minimal Fit', 'nickname' => 'minimal_fit', 'email' => 'minimal@example.com', 'bio' => 'Меньше значит больше'],
            ['name' => 'Fashion AI', 'nickname' => 'fashion_ai', 'email' => 'ai@example.com', 'bio' => 'AI-генерированный стиль'],
            ['name' => 'Vogue Daily', 'nickname' => 'vogue_daily', 'email' => 'voguedaily@example.com', 'bio' => 'Ежедневная мода'],
            ['name' => 'Chic Daily', 'nickname' => 'chic_daily', 'email' => 'chic@example.com', 'bio' => 'Шик каждый день'],
            ['name' => 'Digital Style', 'nickname' => 'digital_style', 'email' => 'digital@example.com', 'bio' => 'Цифровая мода'],
        ];

        foreach ($users as $userData) {
            User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'nickname' => $userData['nickname'],
                    'bio' => $userData['bio'],
                    'password' => Hash::make('password'), // Дефолтный пароль для всех
                ]
            );
        }
    }
}
