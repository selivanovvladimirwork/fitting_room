<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WardrobeController extends Controller
{
    /**
     * Получить гардероб пользователя
     * Возвращает все продукты + пользовательские загрузки
     */
    public function index(Request $request): JsonResponse
    {
        // Системные продукты (каталог)
        $products = Product::where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($p) => $this->formatProduct($p));

        // Пользовательские загрузки хранятся в user meta или отдельной таблице
        // Пока возвращаем только каталог
        return response()->json($products);
    }

    /**
     * Добавить предмет в гардероб (загрузка пользователя)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image_url' => 'required|string',
            'title' => 'nullable|string|max:255',
            'brand' => 'nullable|string|max:100',
        ]);

        // Создаём как приватный продукт пользователя
        $product = Product::create([
            'name' => $validated['title'] ?? 'Загруженная вещь',
            'name_ru' => $validated['title'] ?? 'Загруженная вещь',
            'brand' => $validated['brand'] ?? 'Моя вещь',
            'image_url' => $validated['image_url'],
            'price' => 0,
            'is_active' => true,
            'user_id' => $request->user()->id,
        ]);

        return response()->json($this->formatProduct($product), 201);
    }

    /**
     * Удалить предмет из гардероба
     */
    public function destroy(Request $request, Product $product): JsonResponse
    {
        // Можно удалять только свои загрузки
        if ($product->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $product->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Форматировать продукт для frontend (как Post)
     */
    private function formatProduct(Product $product): array
    {
        return [
            'id' => 'product-' . $product->id,
            'imageUrl' => $product->image_url,
            'author' => $product->brand,
            'title' => $product->name_ru ?? $product->name,
            'likes' => 0,
            'isPrivate' => (bool) $product->user_id,
            'tags' => ['Virtual Fit'],
        ];
    }
}
