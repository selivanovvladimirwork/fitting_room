<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            UserSeeder::class,
            // PostSeeder::class, // Отключаем старый PostSeeder, так как новый ContentSeeder создает посты умнее
            // ProductSeeder::class, // Тоже отключаем
            ContentSeeder::class, // Новый главный сидер контента
            InteractionSeeder::class,
        ]);
    }
}
