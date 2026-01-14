<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DigitalTwin;
use App\Models\DigitalTwinImage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

use App\Services\ImageService;

class DigitalTwinController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Получить аватары текущего пользователя
     */
    public function index(Request $request): JsonResponse
    {
        $avatars = $request->user()->digitalTwins()
            ->with('images')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($a) => $this->formatAvatar($a));

        return response()->json($avatars);
    }

    /**
     * Создать новый аватар
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'referenceImages' => 'sometimes|array|max:5',
            'referenceImages.*' => 'string',
            'stats' => 'required|array',
            'stats.height' => 'required|integer|min:100|max:250',
            'stats.weight' => 'required|integer|min:30|max:300',
            'stats.chest' => 'required|integer|min:50|max:200',
            'stats.waist' => 'required|integer|min:40|max:200',
            'stats.hips' => 'required|integer|min:50|max:200',
        ]);

        // Создаём аватар
        $avatar = DigitalTwin::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'height' => $validated['stats']['height'],
            'weight' => $validated['stats']['weight'],
            'chest' => $validated['stats']['chest'],
            'waist' => $validated['stats']['waist'],
            'hips' => $validated['stats']['hips'],
        ]);

        // Сохраняем все изображения
        $referenceImages = $validated['referenceImages'] ?? [];
        foreach ($referenceImages as $index => $imageData) {
            if (!empty($imageData)) {
                $imagePath = $this->imageService->saveFromBase64($imageData, 'avatars');
                if ($imagePath) {
                    DigitalTwinImage::create([
                        'digital_twin_id' => $avatar->id,
                        'image_url' => $imagePath,
                        'sort_order' => $index,
                    ]);
                }
            }
        }

        return response()->json($this->formatAvatar($avatar->load('images')), 201);
    }

    /**
     * Обновить аватар
     */
    public function update(Request $request, DigitalTwin $digitalTwin): JsonResponse
    {
        // Проверяем владельца
        if ($digitalTwin->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'referenceImages' => 'sometimes|array|max:5',
            'referenceImages.*' => 'string|nullable',
            'generatedAvatarUrl' => 'sometimes|string|nullable',
            'stats' => 'sometimes|array',
            'stats.height' => 'sometimes|integer|min:100|max:250',
            'stats.weight' => 'sometimes|integer|min:30|max:300',
            'stats.chest' => 'sometimes|integer|min:50|max:200',
            'stats.waist' => 'sometimes|integer|min:40|max:200',
            'stats.hips' => 'sometimes|integer|min:50|max:200',
        ]);

        $updateData = [];
        if (isset($validated['name'])) $updateData['name'] = $validated['name'];
        if (isset($validated['generatedAvatarUrl'])) $updateData['generated_avatar_url'] = $validated['generatedAvatarUrl'];
        if (isset($validated['stats']['height'])) $updateData['height'] = $validated['stats']['height'];
        if (isset($validated['stats']['weight'])) $updateData['weight'] = $validated['stats']['weight'];
        if (isset($validated['stats']['chest'])) $updateData['chest'] = $validated['stats']['chest'];
        if (isset($validated['stats']['waist'])) $updateData['waist'] = $validated['stats']['waist'];
        if (isset($validated['stats']['hips'])) $updateData['hips'] = $validated['stats']['hips'];

        if (!empty($updateData)) {
            $digitalTwin->update($updateData);
        }

        // Обновляем изображения (если переданы)
        if (isset($validated['referenceImages'])) {
            // Удаляем старые и добавляем новые
            $digitalTwin->images()->delete();
            
            foreach ($validated['referenceImages'] as $index => $imageData) {
                if (!empty($imageData)) {
                    // Если это уже URL (не base64) - сохраняем как есть
                    if (str_starts_with($imageData, 'http://') || str_starts_with($imageData, 'https://')) {
                        // Оставляем как есть (не пересохраняем)
                        DigitalTwinImage::create([
                            'digital_twin_id' => $digitalTwin->id,
                            'image_url' => $imageData,
                            'sort_order' => $index,
                        ]);
                    } else {
                        // Base64 - сохраняем файл
                        $imagePath = $this->imageService->saveFromBase64($imageData, 'avatars');
                        if ($imagePath) {
                            DigitalTwinImage::create([
                                'digital_twin_id' => $digitalTwin->id,
                                'image_url' => $imagePath,
                                'sort_order' => $index,
                            ]);
                        }
                    }
                }
            }
        }

        return response()->json($this->formatAvatar($digitalTwin->fresh()->load('images')));
    }

    /**
     * Удалить аватар
     */
    public function destroy(Request $request, DigitalTwin $digitalTwin): JsonResponse
    {
        if ($digitalTwin->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $digitalTwin->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Форматировать аватар для frontend
     */
    private function formatAvatar(DigitalTwin $avatar): array
    {
        // Собираем все изображения из связи images()
        $referenceImages = $avatar->images->map(fn($img) => $this->toFullUrl($img->image_url))->toArray();
        
        // Fallback на старое поле image_url если нет изображений в новой таблице
        if (empty($referenceImages) && $avatar->image_url) {
            $referenceImages = [$this->toFullUrl($avatar->image_url)];
        }

        return [
            'id' => (string) $avatar->id,
            'name' => $avatar->name,
            'referenceImages' => $referenceImages,
            'generatedAvatarUrl' => $this->toFullUrl($avatar->generated_avatar_url),
            'stats' => [
                'height' => $avatar->height,
                'weight' => $avatar->weight,
                'chest' => $avatar->chest,
                'waist' => $avatar->waist,
                'hips' => $avatar->hips,
            ],
        ];
    }

    /**
     * Преобразовать относительный путь или URL в полный URL
     */
    private function toFullUrl(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        // Если уже полный URL - возвращаем как есть
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        // Относительный путь - добавляем Storage URL
        return asset('storage/' . $path);
    }
}
