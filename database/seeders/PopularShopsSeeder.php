<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Shop;

class PopularShopsSeeder extends Seeder
{
    public function run(): void
    {
        $shops = [
            [
                'name' => 'Wildberries',
                'slug' => 'wildberries',
                'domain' => 'wildberries.ru',
                'external_url' => 'https://www.wildberries.ru',
                'category' => 'marketplace',
                'description' => 'Крупнейший маркетплейс России',
                'is_popular' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'OZON',
                'slug' => 'ozon',
                'domain' => 'ozon.ru',
                'external_url' => 'https://www.ozon.ru',
                'category' => 'marketplace',
                'description' => 'Маркетплейс с широким ассортиментом',
                'is_popular' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Lamoda',
                'slug' => 'lamoda',
                'domain' => 'lamoda.ru',
                'external_url' => 'https://www.lamoda.ru',
                'category' => 'fashion',
                'description' => 'Онлайн-магазин одежды и обуви',
                'is_popular' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Zara',
                'slug' => 'zara',
                'domain' => 'zara.com',
                'external_url' => 'https://www.zara.com/ru/',
                'category' => 'fashion',
                'description' => 'Мировой бренд одежды',
                'is_popular' => true,
                'sort_order' => 4,
            ],
            [
                'name' => 'H&M',
                'slug' => 'hm',
                'domain' => 'hm.com',
                'external_url' => 'https://www2.hm.com/ru_ru/',
                'category' => 'fashion',
                'description' => 'Модная одежда для всей семьи',
                'is_popular' => true,
                'sort_order' => 5,
            ],
            [
                'name' => 'LIME',
                'slug' => 'lime',
                'domain' => 'lime-shop.com',
                'external_url' => 'https://lime-shop.com/',
                'category' => 'fashion',
                'description' => 'Российский бренд одежды',
                'is_popular' => true,
                'sort_order' => 6,
            ],
            [
                'name' => 'ЦУМ',
                'slug' => 'tsum',
                'domain' => 'tsum.ru',
                'external_url' => 'https://www.tsum.ru/',
                'category' => 'fashion',
                'description' => 'Универмаг премиум-класса',
                'is_popular' => true,
                'sort_order' => 7,
            ],
            [
                'name' => 'Спортмастер',
                'slug' => 'sportmaster',
                'domain' => 'sportmaster.ru',
                'external_url' => 'https://www.sportmaster.ru/',
                'category' => 'sport',
                'description' => 'Спортивные товары и одежда',
                'is_popular' => true,
                'sort_order' => 8,
            ],
        ];

        foreach ($shops as $shopData) {
            Shop::updateOrCreate(
                ['slug' => $shopData['slug']],
                $shopData
            );
        }
    }
}
