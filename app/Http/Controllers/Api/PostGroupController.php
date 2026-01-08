<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PostGroup;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PostGroupController extends Controller
{
    /**
     * Получить группы постов текущего пользователя
     */
    public function index(Request $request): JsonResponse
    {
        $groups = $request->user()->postGroups()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($g) => $this->formatGroup($g));

        return response()->json($groups);
    }

    /**
     * Создать новую группу
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'posts' => 'required|array|min:1',
            'posts.*.id' => 'required|string',
            'posts.*.imageUrl' => 'required|string',
        ]);

        $group = PostGroup::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'post_ids' => $validated['posts'],
        ]);

        return response()->json($this->formatGroup($group), 201);
    }

    /**
     * Обновить группу
     */
    public function update(Request $request, PostGroup $postGroup): JsonResponse
    {
        if ($postGroup->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'posts' => 'sometimes|array',
            'posts.*.id' => 'sometimes|string',
            'posts.*.imageUrl' => 'sometimes|string',
        ]);

        $updateData = [];
        if (isset($validated['name'])) $updateData['name'] = $validated['name'];
        if (isset($validated['posts'])) $updateData['post_ids'] = $validated['posts'];

        $postGroup->update($updateData);

        return response()->json($this->formatGroup($postGroup->fresh()));
    }

    /**
     * Удалить группу
     */
    public function destroy(Request $request, PostGroup $postGroup): JsonResponse
    {
        if ($postGroup->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $postGroup->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Sync all groups from frontend (bulk update)
     */
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'groups' => 'present|array',
            'groups.*.id' => 'sometimes|string',
            'groups.*.name' => 'required|string|max:255',
            'groups.*.posts' => 'present|array',
        ]);

        $userId = $request->user()->id;
        
        // Delete existing groups for user
        PostGroup::where('user_id', $userId)->delete();
        
        // Create new groups if any
        $createdGroups = [];
        foreach ($validated['groups'] ?? [] as $groupData) {
            $group = PostGroup::create([
                'user_id' => $userId,
                'name' => $groupData['name'],
                'post_ids' => $groupData['posts'] ?? [],
            ]);
            $createdGroups[] = $this->formatGroup($group);
        }

        return response()->json($createdGroups);
    }

    /**
     * Форматировать группу для frontend
     */
    private function formatGroup(PostGroup $group): array
    {
        return [
            'id' => (string) $group->id,
            'name' => $group->name,
            'posts' => $group->post_ids ?? [],
            'createdAt' => $group->created_at->timestamp * 1000,
        ];
    }
}
