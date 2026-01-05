<?php

namespace Database\Seeders;

use App\Models\Post;
use Illuminate\Database\Seeder;

class PostSeeder extends Seeder
{
    /**
     * Импорт моковых постов из FeedView и HomeView
     */
    public function run(): void
    {
        $posts = [
            // FeedView / HomeView posts
            ['image_url' => '/mock/uploaded_image_0_1767382693233.png', 'author_name' => '@vogue_edge', 'likes' => 3200, 'tags' => ['Minimal']],
            ['image_url' => '/mock/uploaded_image_1_1767382693233.png', 'author_name' => '@urban_knight', 'likes' => 1150, 'tags' => ['Techwear']],
            ['image_url' => '/mock/uploaded_image_2_1767382693233.png', 'author_name' => '@luxe_daily', 'likes' => 2800, 'tags' => ['Silk']],
            ['image_url' => '/mock/uploaded_image_3_1767382693233.png', 'author_name' => '@nordic_style', 'likes' => 940, 'tags' => ['Scandi']],
            ['image_url' => '/mock/uploaded_image_4_1767382693233.png', 'author_name' => '@office_chic', 'likes' => 1500, 'tags' => ['Business']],
            ['image_url' => '/mock/uploaded_image_0_1767382807800.png', 'author_name' => '@denim_cult', 'likes' => 2100, 'tags' => ['Casual']],
            ['image_url' => '/mock/uploaded_image_1_1767382807800.png', 'author_name' => '@fit_life', 'likes' => 3400, 'tags' => ['Sport']],
            ['image_url' => '/mock/uploaded_image_2_1767382807800.png', 'author_name' => '@autumn_vibes', 'likes' => 1800, 'tags' => ['Outerwear']],
            ['image_url' => '/mock/uploaded_image_3_1767382807800.png', 'author_name' => '@boho_soul', 'likes' => 2200, 'tags' => ['Boho']],
        ];

        foreach ($posts as $post) {
            Post::firstOrCreate(
                ['image_url' => $post['image_url']],
                [
                    'author_name' => $post['author_name'],
                    'likes' => $post['likes'],
                    'tags' => $post['tags'],
                    'is_private' => false,
                ]
            );
        }
    }
}
