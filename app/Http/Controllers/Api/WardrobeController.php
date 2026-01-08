<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

use App\Services\ImageService;

class WardrobeController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }
    /**
     * Получить гардероб пользователя (только сохранённые генерации)
     */
    public function index(Request $request): JsonResponse
    {
        $products = Product::where('user_id', $request->user()->id)
            ->where('brand', 'Virtual Fit') // Только сохранённые результаты генерации
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($p) => $this->formatProduct($p));

        return response()->json($products);
    }

    /**
     * Получить каталог товаров (системные продукты для примерки)
     */
    public function catalog(Request $request): JsonResponse
    {
        $products = Product::whereNull('user_id')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($p) => $this->formatProduct($p));

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
        // Создаём как приватный продукт пользователя
        $imagePath = $this->imageService->saveFromBase64($validated['image_url'], 'wardrobe');
        
        $product = Product::create([
            'name_ru' => $validated['title'] ?? 'Загруженная вещь',
            'brand' => $validated['brand'] ?? 'Моя вещь',
            'images' => [$imagePath],
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
     * Форматировать продукт для frontend
     */
    private function formatProduct(Product $product): array
    {
        $images = $product->images ?? [];
        $firstImage = !empty($images) ? $images[0] : null;
        
        // Check if image is already a full URL
        $imageUrl = null;
        if ($firstImage) {
            if (str_starts_with($firstImage, 'http://') || str_starts_with($firstImage, 'https://')) {
                $imageUrl = $firstImage;
            } else {
                $imageUrl = url('storage/' . $firstImage);
            }
        }
        
        return [
            'id' => 'product-' . $product->id,
            'imageUrl' => $imageUrl,
            'author' => $product->brand,
            'title' => $product->name_ru,
            'likes' => 0,
            'isPrivate' => (bool) $product->user_id,
            'tags' => ['Virtual Fit'],
        ];
    }
}

