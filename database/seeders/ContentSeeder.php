<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        if ($users->isEmpty()) {
            return;
        }

        // Данные: Товар -> [Посты] — только с реальными изображениями
        $content = [
            [
                'product' => [
                    'name_ru' => 'Черное вечернее платье',
                    'brand' => 'Vogue Line',
                    'store_url' => 'https://example.com/dress',
                    'images' => ['products/dress_black_1.jpg'],
                ],
                'posts' => [
                    ['title' => 'Вечерний выход', 'image_url' => 'posts/dress_black_lifestyle_1.jpg', 'tags' => ['Evening', 'Black']],
                    ['title' => 'Элегантность', 'image_url' => 'posts/dress_black_lifestyle_2.jpg', 'tags' => ['Chic']],
                ]
            ],
            [
                'product' => [
                    'name_ru' => 'Бежевый тренч',
                    'brand' => 'Urban Classics',
                    'store_url' => 'https://example.com/trench',
                    'images' => ['products/trench_beige_1.jpg'],
                ],
                'posts' => [
                    ['title' => 'Осеннее настроение', 'image_url' => 'posts/trench_lifestyle_1.jpg', 'tags' => ['Autumn', 'Street']],
                    ['title' => 'Городской стиль', 'image_url' => 'posts/trench_lifestyle_2.jpg', 'tags' => ['City']],
                    ['title' => 'Кофе брейк', 'image_url' => 'posts/trench_lifestyle_3.jpg', 'tags' => ['Coffee']],
                ]
            ],
        ];

        foreach ($content as $item) {
            // Создаем товар (привязываем к первому попавшемуся или админу, не критично, пусть будет случайный юзер)
            $owner = $users->random();
            
            $product = Product::create(array_merge($item['product'], [
                'user_id' => $owner->id
            ]));

            // Создаем посты для этого товара
            foreach ($item['posts'] as $postData) {
                // Автор поста - случайный пользователь (не обязательно владелец товара)
                $author = $users->random();

                Post::create([
                    'user_id' => $author->id,
                    'product_id' => $product->id, // СВЯЗЬ!
                    'author_name' => '@' . $author->nickname,
                    'title' => $postData['title'],
                    'image_url' => $postData['image_url'], // В реале тоже заглушка пока
                    'likes' => rand(50, 5000),
                    'tags' => $postData['tags'],
                    'is_private' => false,
                ]);
            }
        }
        
        echo "Content seeded: " . count($content) . " products and related posts created.\n";
    }
}
