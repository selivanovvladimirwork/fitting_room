<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PostController extends Controller
{
    /**
     * Получить все публичные посты
     */
    public function index(): JsonResponse
    {
        $posts = Post::where('is_private', false)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($p) => [
                'id' => (string) $p->id,
                'imageUrl' => $p->image_url,
                'author' => $p->author_name,
                'likes' => $p->likes,
                'isPrivate' => $p->is_private,
                'tags' => $p->tags ?? [],
                'title' => $p->title,
            ]);

        return response()->json($posts);
    }

    /**
     * Получить один пост
     */
    public function show(Post $post): JsonResponse
    {
        return response()->json([
            'id' => (string) $post->id,
            'imageUrl' => $post->image_url,
            'author' => $post->author_name,
            'likes' => $post->likes,
            'isPrivate' => $post->is_private,
            'tags' => $post->tags ?? [],
            'title' => $post->title,
        ]);
    }

    /**
     * Создать новый пост (требуется аутентификация)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'image_url' => 'required|string',
            'author_name' => 'nullable|string|max:100',
            'tags' => 'nullable|array',
            'is_private' => 'nullable|boolean',
        ]);

        $post = Post::create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'] ?? null,
            'image_url' => $validated['image_url'],
            'author_name' => $validated['author_name'] ?? '@' . $request->user()->name,
            'tags' => $validated['tags'] ?? [],
            'is_private' => $validated['is_private'] ?? false,
            'likes' => 0,
        ]);

        return response()->json([
            'id' => (string) $post->id,
            'imageUrl' => $post->image_url,
            'author' => $post->author_name,
            'likes' => $post->likes,
            'isPrivate' => $post->is_private,
            'tags' => $post->tags,
            'title' => $post->title,
        ], 201);
    }
}
