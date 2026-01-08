<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Создание учётной записи администратора для Filament
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@fittingroom.loc'],
            [
                'name' => 'Admin',
                'nickname' => 'admin',
                'bio' => 'Администратор системы',
                'password' => Hash::make('admin123'),
            ]
        );

        echo "Admin user created:\n";
        echo "Email: admin@fittingroom.loc\n";
        echo "Password: admin123\n";
    }
}
