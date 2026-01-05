<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DigitalTwin;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DigitalTwinController extends Controller
{
    /**
     * Получить аватары текущего пользователя
     */
    public function index(Request $request): JsonResponse
    {
        $avatars = $request->user()->digitalTwins()
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
            'referenceImages' => 'required|array|min:1',
            'referenceImages.*' => 'string',
            'stats' => 'required|array',
            'stats.height' => 'required|integer|min:100|max:250',
            'stats.weight' => 'required|integer|min:30|max:300',
            'stats.chest' => 'required|integer|min:50|max:200',
            'stats.waist' => 'required|integer|min:40|max:200',
            'stats.hips' => 'required|integer|min:50|max:200',
        ]);

        // Первое изображение как основное
        $imageUrl = $validated['referenceImages'][0] ?? null;

        $avatar = DigitalTwin::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'image_url' => $imageUrl,
            'height' => $validated['stats']['height'],
            'weight' => $validated['stats']['weight'],
            'chest' => $validated['stats']['chest'],
            'waist' => $validated['stats']['waist'],
            'hips' => $validated['stats']['hips'],
        ]);

        return response()->json($this->formatAvatar($avatar), 201);
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
            'referenceImages' => 'sometimes|array',
            'referenceImages.*' => 'string',
            'stats' => 'sometimes|array',
            'stats.height' => 'sometimes|integer|min:100|max:250',
            'stats.weight' => 'sometimes|integer|min:30|max:300',
            'stats.chest' => 'sometimes|integer|min:50|max:200',
            'stats.waist' => 'sometimes|integer|min:40|max:200',
            'stats.hips' => 'sometimes|integer|min:50|max:200',
        ]);

        $updateData = [];
        if (isset($validated['name'])) $updateData['name'] = $validated['name'];
        if (isset($validated['referenceImages'][0])) $updateData['image_url'] = $validated['referenceImages'][0];
        if (isset($validated['stats']['height'])) $updateData['height'] = $validated['stats']['height'];
        if (isset($validated['stats']['weight'])) $updateData['weight'] = $validated['stats']['weight'];
        if (isset($validated['stats']['chest'])) $updateData['chest'] = $validated['stats']['chest'];
        if (isset($validated['stats']['waist'])) $updateData['waist'] = $validated['stats']['waist'];
        if (isset($validated['stats']['hips'])) $updateData['hips'] = $validated['stats']['hips'];

        $digitalTwin->update($updateData);

        return response()->json($this->formatAvatar($digitalTwin->fresh()));
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
        return [
            'id' => (string) $avatar->id,
            'name' => $avatar->name,
            'referenceImages' => $avatar->image_url ? [$avatar->image_url] : [],
            'stats' => [
                'height' => $avatar->height,
                'weight' => $avatar->weight,
                'chest' => $avatar->chest,
                'waist' => $avatar->waist,
                'hips' => $avatar->hips,
            ],
        ];
    }
}
