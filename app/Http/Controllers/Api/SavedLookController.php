<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavedLook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedLookController extends Controller
{
    /**
     * Get all saved looks for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $looks = $request->user()->savedLooks()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($look) {
                return [
                    'id' => (string) $look->id,
                    'imageUrl' => $look->image_url,
                    'title' => $look->title,
                    'author' => $look->brand ?? 'Virtual Fit',
                    'storeUrl' => $look->store_url,
                    'likes' => 0,
                    'isPrivate' => true,
                    'tags' => [],
                ];
            });

        return response()->json($looks);
    }

    /**
     * Add a new saved look
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image_url' => 'required|string',
            'title' => 'nullable|string|max:255',
            'brand' => 'nullable|string|max:255',
            'store_url' => 'nullable|string|max:500',
        ]);

        $look = $request->user()->savedLooks()->create([
            'image_url' => $validated['image_url'],
            'title' => $validated['title'] ?? null,
            'brand' => $validated['brand'] ?? null,
            'store_url' => $validated['store_url'] ?? null,
        ]);

        return response()->json([
            'id' => (string) $look->id,
            'imageUrl' => $look->image_url,
            'title' => $look->title,
            'author' => $look->brand ?? 'Virtual Fit',
            'storeUrl' => $look->store_url,
            'likes' => 0,
            'isPrivate' => true,
            'tags' => [],
        ], 201);
    }

    /**
     * Remove a saved look
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $look = $request->user()->savedLooks()->find($id);

        if (!$look) {
            return response()->json(['message' => 'Look not found'], 404);
        }

        $look->delete();

        return response()->json(['message' => 'Look removed']);
    }
}
