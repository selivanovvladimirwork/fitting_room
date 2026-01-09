<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\YandexSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    private YandexSearchService $searchService;

    public function __construct(YandexSearchService $searchService)
    {
        $this->searchService = $searchService;
    }

    /**
     * Поиск магазинов
     * POST /api/search
     * 
     * @param Request $request { query: string }
     * @return JsonResponse [{ title, url, snippet, domain }]
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|min:2|max:200',
        ]);

        $query = $request->input('query');
        $results = $this->searchService->searchShops($query);

        return response()->json($results);
    }

    /**
     * Поиск товаров с картинками
     * POST /api/search/products
     * 
     * @param Request $request { query: string }
     * @return JsonResponse [{ id, imageUrl, title, url, domain, price }]
     */
    public function searchProducts(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|min:1|max:200',
        ]);

        $query = $request->input('query');
        $results = $this->searchService->searchProducts($query);

        return response()->json($results);
    }
}

