<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Post;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InteractionSeeder extends Seeder
{
    /**
     * Создание тестовых взаимодействий: лайки, сохранения, подписки
     */
    public function run(): void
    {
        $users = User::all();
        $posts = Post::all();

        if ($users->isEmpty() || $posts->isEmpty()) {
            echo "Warning: No users or posts found. Run UserSeeder and PostSeeder first.\n";
            return;
        }

        // Создаём подписки (каждый пользователь подписан на 3-5 других)
        foreach ($users as $user) {
            $followCount = rand(3, 5);
            $toFollow = $users->where('id', '!=', $user->id)->random(min($followCount, $users->count() - 1));
            
            foreach ($toFollow as $followedUser) {
                DB::table('follows')->insertOrIgnore([
                    'follower_id' => $user->id,
                    'following_id' => $followedUser->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Создаём лайки (каждый пользователь лайкает 5-10 постов)
        foreach ($users as $user) {
            $likeCount = rand(5, 10);
            $toLike = $posts->random(min($likeCount, $posts->count()));
            
            foreach ($toLike as $post) {
                DB::table('liked_posts')->insertOrIgnore([
                    'user_id' => $user->id,
                    'post_id' => $post->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Создаём сохранения (каждый пользователь сохраняет 3-7 постов)
        foreach ($users as $user) {
            $saveCount = rand(3, 7);
            $toSave = $posts->random(min($saveCount, $posts->count()));
            
            foreach ($toSave as $post) {
                DB::table('saved_posts')->insertOrIgnore([
                    'user_id' => $user->id,
                    'post_id' => $post->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        echo "Interactions seeded successfully!\n";
    }
}
