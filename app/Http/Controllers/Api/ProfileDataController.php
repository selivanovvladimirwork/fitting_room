<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProfileDataController extends Controller
{
    /**
     * Получить посты текущего пользователя
     */
    public function myPosts(Request $request): JsonResponse
    {
        $posts = $request->user()->posts()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($posts);
    }

    /**
     * Получить пользователей, на которых подписан
     */
    public function following(Request $request): JsonResponse
    {
        $following = $request->user()->following()
            ->select('users.id', 'users.name', 'users.nickname', 'users.bio')
            ->orderBy('follows.created_at', 'desc')
            ->get();

        return response()->json($following);
    }

    /**
     * Получить сохранённые посты
     */
    public function savedPosts(Request $request): JsonResponse
    {
        $saved = $request->user()->savedPosts()
            ->orderBy('saved_posts.created_at', 'desc')
            ->get();

        return response()->json($saved);
    }

    /**
     * Получить лайкнутые посты
     */
    public function likedPosts(Request $request): JsonResponse
    {
        $liked = $request->user()->likedPosts()
            ->orderBy('liked_posts.created_at', 'desc')
            ->get();

        return response()->json($liked);
    }

    /**
     * Лайкнуть пост
     */
    public function likePost(Request $request, Post $post): JsonResponse
    {
        $request->user()->likedPosts()->syncWithoutDetaching([$post->id]);
        $post->increment('likes');

        return response()->json(['message' => 'Post liked', 'likes' => $post->likes]);
    }

    /**
     * Убрать лайк с поста
     */
    public function unlikePost(Request $request, Post $post): JsonResponse
    {
        $request->user()->likedPosts()->detach($post->id);
        $post->decrement('likes');

        return response()->json(['message' => 'Post unliked', 'likes' => $post->likes]);
    }

    /**
     * Сохранить пост
     */
    public function savePost(Request $request, Post $post): JsonResponse
    {
        $request->user()->savedPosts()->syncWithoutDetaching([$post->id]);

        return response()->json(['message' => 'Post saved']);
    }

    /**
     * Убрать пост из сохранённых
     */
    public function unsavePost(Request $request, Post $post): JsonResponse
    {
        $request->user()->savedPosts()->detach($post->id);

        return response()->json(['message' => 'Post unsaved']);
    }

    /**
     * Подписаться на пользователя
     */
    public function followUser(Request $request, User $user): JsonResponse
    {
        if ($request->user()->id === $user->id) {
            return response()->json(['error' => 'Cannot follow yourself'], 400);
        }

        $request->user()->following()->syncWithoutDetaching([$user->id]);

        return response()->json(['message' => 'User followed']);
    }

    /**
     * Отписаться от пользователя
     */
    public function unfollowUser(Request $request, User $user): JsonResponse
    {
        $request->user()->following()->detach($user->id);

        return response()->json(['message' => 'User unfollowed']);
    }
}
