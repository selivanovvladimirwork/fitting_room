<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FavoriteExternalShop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteExternalShopController extends Controller
{
    /**
     * Получить список избранных внешних магазинов
     */
    public function index(Request $request): JsonResponse
    {
        $shops = $request->user()->favoriteExternalShops()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($shop) => [
                'id' => $shop->id,
                'domain' => $shop->domain,
                'url' => $shop->url,
                'addedAt' => $shop->created_at->toISOString(),
            ]);

        return response()->json($shops);
    }

    /**
     * Добавить магазин в избранное
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'domain' => 'required|string|max:255',
            'url' => 'nullable|string|max:2048',
        ]);

        $shop = $request->user()->favoriteExternalShops()->updateOrCreate(
            ['domain' => $validated['domain']],
            ['url' => $validated['url'] ?? null]
        );

        return response()->json([
            'id' => $shop->id,
            'domain' => $shop->domain,
            'url' => $shop->url,
            'addedAt' => $shop->created_at->toISOString(),
        ], 201);
    }

    /**
     * Удалить магазин из избранного
     */
    public function destroy(Request $request, string $domain): JsonResponse
    {
        $deleted = $request->user()->favoriteExternalShops()
            ->where('domain', $domain)
            ->delete();

        if ($deleted) {
            return response()->json(['message' => 'Removed from favorites']);
        }

        return response()->json(['message' => 'Not found'], 404);
    }

    /**
     * Проверить, добавлен ли магазин в избранное
     */
    public function check(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'domains' => 'required|array',
            'domains.*' => 'string|max:255',
        ]);

        $favorites = $request->user()->favoriteExternalShops()
            ->whereIn('domain', $validated['domains'])
            ->pluck('domain')
            ->toArray();

        return response()->json(['favorites' => $favorites]);
    }
}
