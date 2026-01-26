<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TokenSystemSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SubscriptionPlanSeeder::class,
            TokenPackageSeeder::class,
        ]);
    }
}
