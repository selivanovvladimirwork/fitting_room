<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Импорт моковых продуктов (гардероб) из HomeView
     */
    public function run(): void
    {
        // Создаём категорию если нет
        $category = Category::firstOrCreate(
            ['slug' => 'wardrobe'],
            ['name' => 'Гардероб']
        );

        $products = [
            [
                'name' => 'Silk Evening Dress',
                'name_ru' => 'Шелковое вечернее платье',
                'brand' => 'Gucci',
                'image_url' => '/mock/div_1_silk_dress_asian_1767457702563.png',
                'price' => 0,
            ],
            [
                'name' => 'Vintage Denim Jacket',
                'name_ru' => 'Винтажная джинсовая куртка',
                'brand' => "Levi's",
                'image_url' => '/mock/div_2_denim_black_male_1767457717602.png',
                'price' => 0,
            ],
            [
                'name' => 'Classic Trench Coat',
                'name_ru' => 'Классический тренч',
                'brand' => 'Burberry',
                'image_url' => '/mock/div_3_trench_redhead_1767457730112.png',
                'price' => 0,
            ],
            [
                'name' => 'Sport Outfit',
                'name_ru' => 'Спортивный костюм',
                'brand' => 'Alo Yoga',
                'image_url' => '/mock/div_4_yoga_latina_1767457754254.png',
                'price' => 0,
            ],
            [
                'name' => 'Business Suit',
                'name_ru' => 'Деловой костюм',
                'brand' => 'Hugo Boss',
                'image_url' => '/mock/div_5_business_white_male_1767457767827.png',
                'price' => 0,
            ],
            [
                'name' => 'Boho Dress',
                'name_ru' => 'Платье в стиле Бохо',
                'brand' => 'Free People',
                'image_url' => '/mock/div_6_boho_black_female_1767457782503.png',
                'price' => 0,
            ],
        ];

        foreach ($products as $product) {
            Product::firstOrCreate(
                ['image_url' => $product['image_url']],
                [
                    'name' => $product['name'],
                    'name_ru' => $product['name_ru'],
                    'brand' => $product['brand'],
                    'price' => $product['price'],
                    'category_id' => $category->id,
                    'is_active' => true,
                ]
            );
        }
    }
}
