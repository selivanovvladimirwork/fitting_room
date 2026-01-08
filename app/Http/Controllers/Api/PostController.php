<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

use App\Services\ImageService;

class PostController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }
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
                'imageUrl' => url('storage/' . $p->image_url),
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
        $post->load('shop');
        
        $response = [
            'id' => (string) $post->id,
            'imageUrl' => url('storage/' . $post->image_url),
            'author' => $post->author_name,
            'likes' => $post->likes,
            'isPrivate' => $post->is_private,
            'tags' => $post->tags ?? [],
            'title' => $post->title,
        ];
        
        if ($post->shop) {
            $response['shop'] = [
                'id' => $post->shop->id,
                'name' => $post->shop->name,
                'slug' => $post->shop->slug,
                'logoUrl' => $post->shop->logo_url ? url('storage/' . $post->shop->logo_url) : null,
                'externalUrl' => $post->shop->external_url,
            ];
        }
        
        return response()->json($response);
    }

    /**
     * Получить посты пользователя по никнейму
     */
    public function byUser(string $nickname): JsonResponse
    {
        $user = User::where('nickname', $nickname)->first();
        
        if (!$user) {
            return response()->json([]);
        }

        $posts = Post::where('user_id', $user->id)
            ->where('is_private', false)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($p) => [
                'id' => (string) $p->id,
                'imageUrl' => url('storage/' . $p->image_url),
                'author' => $p->author_name,
                'likes' => $p->likes,
                'isPrivate' => $p->is_private,
                'tags' => $p->tags ?? [],
                'title' => $p->title,
            ]);

        return response()->json($posts);
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

        // Сохраняем изображение через сервис
        $imagePath = $this->imageService->saveFromBase64($validated['image_url'], 'posts');

        $post = Post::create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'] ?? null,
            'image_url' => $imagePath, // Сохраняем путь к файлу
            'author_name' => $validated['author_name'] ?? '@' . $request->user()->nickname,
            'tags' => $validated['tags'] ?? [],
            'is_private' => $validated['is_private'] ?? false,
            'likes' => 0,
        ]);

        return response()->json([
            'id' => (string) $post->id,
            'imageUrl' => url('storage/' . $post->image_url),
            'author' => $post->author_name,
            'likes' => $post->likes,
            'isPrivate' => $post->is_private,
            'tags' => $post->tags,
            'title' => $post->title,
        ], 201);
    }
}
