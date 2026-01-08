<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    /**
     * Список всех магазинов
     */
    public function index(): JsonResponse
    {
        $shops = Shop::withCount('posts')->get()->map(fn($shop) => [
            'id' => $shop->id,
            'name' => $shop->name,
            'slug' => $shop->slug,
            'logoUrl' => $shop->logo_url ? url('storage/' . $shop->logo_url) : null,
            'externalUrl' => $shop->external_url,
            'postsCount' => $shop->posts_count,
        ]);

        return response()->json($shops);
    }

    /**
     * Детали магазина по slug
     */
    public function show(string $slug): JsonResponse
    {
        $shop = Shop::where('slug', $slug)->with('posts')->firstOrFail();

        return response()->json([
            'id' => $shop->id,
            'name' => $shop->name,
            'slug' => $shop->slug,
            'logoUrl' => $shop->logo_url ? url('storage/' . $shop->logo_url) : null,
            'externalUrl' => $shop->external_url,
            'description' => $shop->description,
            'posts' => $shop->posts->map(fn($p) => [
                'id' => (string) $p->id,
                'imageUrl' => url('storage/' . $p->image_url),
                'author' => $p->author_name,
                'likes' => $p->likes,
                'isPrivate' => $p->is_private,
                'tags' => $p->tags ?? [],
                'title' => $p->title,
            ]),
        ]);
    }

    /**
     * Избранные магазины пользователя
     */
    public function favorites(Request $request): JsonResponse
    {
        $shops = $request->user()->favoriteShops()->withCount('posts')->get()->map(fn($shop) => [
            'id' => $shop->id,
            'name' => $shop->name,
            'slug' => $shop->slug,
            'logoUrl' => $shop->logo_url ? url('storage/' . $shop->logo_url) : null,
            'externalUrl' => $shop->external_url,
            'postsCount' => $shop->posts_count,
        ]);

        return response()->json($shops);
    }

    /**
     * Добавить магазин в избранное
     */
    public function addFavorite(Request $request, Shop $shop): JsonResponse
    {
        $request->user()->favoriteShops()->syncWithoutDetaching([$shop->id]);
        return response()->json(['success' => true]);
    }

    /**
     * Убрать магазин из избранного
     */
    public function removeFavorite(Request $request, Shop $shop): JsonResponse
    {
        $request->user()->favoriteShops()->detach($shop->id);
        return response()->json(['success' => true]);
    }
}
