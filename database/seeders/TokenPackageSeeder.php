<?php

namespace Database\Seeders;

use App\Models\TokenPackage;
use Illuminate\Database\Seeder;

class TokenPackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            [
                'name' => 'Starter Pack',
                'tokens' => 10,
                'price' => 199.00,
                'currency' => 'RUB',
                'is_active' => true,
            ],
            [
                'name' => 'Pro Pack',
                'tokens' => 50,
                'price' => 790.00,
                'currency' => 'RUB',
                'is_active' => true,
            ],
            [
                'name' => 'Ultimate Pack',
                'tokens' => 100,
                'price' => 1290.00,
                'currency' => 'RUB',
                'is_active' => true,
            ],
        ];

        foreach ($packages as $pkg) {
            TokenPackage::updateOrCreate(
                ['name' => $pkg['name']],
                $pkg
            );
        }
    }
}
