<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\DigitalTwin;
use App\Models\Product;

class MigrationController extends Controller
{
    /**
     * Мигрировать данные из localStorage в БД
     * Вызывается один раз при первом входе
     */
    public function migrateLocalData(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avatars' => 'nullable|array',
            'avatars.*.name' => 'required|string',
            'avatars.*.referenceImages' => 'required|array',
            'avatars.*.stats' => 'required|array',
            'wardrobe' => 'nullable|array',
            'wardrobe.*.imageUrl' => 'required|string',
            'wardrobe.*.author' => 'nullable|string',
            'wardrobe.*.title' => 'nullable|string',
        ]);

        $user = $request->user();
        $imported = [
            'avatars' => 0,
            'wardrobe' => 0,
        ];

        // Импорт аватаров
        if (!empty($validated['avatars'])) {
            foreach ($validated['avatars'] as $avatar) {
                DigitalTwin::create([
                    'user_id' => $user->id,
                    'name' => $avatar['name'],
                    'image_url' => $avatar['referenceImages'][0] ?? null,
                    'height' => $avatar['stats']['height'] ?? 175,
                    'weight' => $avatar['stats']['weight'] ?? 70,
                    'chest' => $avatar['stats']['chest'] ?? 90,
                    'waist' => $avatar['stats']['waist'] ?? 70,
                    'hips' => $avatar['stats']['hips'] ?? 95,
                ]);
                $imported['avatars']++;
            }
        }

        // Импорт гардероба (только пользовательские загрузки, не каталожные)
        if (!empty($validated['wardrobe'])) {
            foreach ($validated['wardrobe'] as $item) {
                // Пропускаем если это каталожный предмет (id начинается с 'fit-')
                if (isset($item['id']) && str_starts_with($item['id'], 'fit-')) {
                    continue;
                }
                
                Product::create([
                    'user_id' => $user->id,
                    'name' => $item['title'] ?? 'Загруженная вещь',
                    'name_ru' => $item['title'] ?? 'Загруженная вещь',
                    'brand' => $item['author'] ?? 'Моя вещь',
                    'image_url' => $item['imageUrl'],
                    'price' => 0,
                    'is_active' => true,
                ]);
                $imported['wardrobe']++;
            }
        }

        return response()->json([
            'success' => true,
            'imported' => $imported,
        ]);
    }
}
