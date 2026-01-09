<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class YandexSearchService
{
    private string $apiKeyId;
    private string $apiKeySecret;
    private string $folderId;
    private string $baseUrl = 'https://searchapi.api.cloud.yandex.net/v2/web/searchAsync';

    public function __construct()
    {
        $this->apiKeyId = config('services.yandex.api_key_id', '');
        $this->apiKeySecret = config('services.yandex.api_key_secret', '');
        $this->folderId = config('services.yandex.folder_id', '');
    }

    /**
     * Поиск магазинов через Yandex Cloud Search API
     *
     * @param string $query Поисковый запрос
     * @return array Массив результатов [{title, url, snippet, domain}]
     */
    public function searchShops(string $query): array
    {
        // Если ключи не настроены, возвращаем заглушку
        if (empty($this->apiKeySecret) || empty($this->folderId)) {
            return $this->getMockResults($query);
        }

        try {
            $searchQuery = $query . ' магазин купить';
            $results = $this->performSearch($searchQuery);
            
            return array_map(function ($item) {
                return [
                    'title' => $item['title'] ?? '',
                    'url' => $item['url'] ?? '',
                    'snippet' => $item['snippet'] ?? '',
                    'domain' => $item['domain'] ?? '',
                ];
            }, $results);

        } catch (\Exception $e) {
            Log::error('Yandex search failed', ['error' => $e->getMessage()]);
            return $this->getMockResults($query);
        }
    }

    /**
     * Поиск товаров через Yandex Image Search API
     *
     * @param string $query Поисковый запрос
     * @return array Массив товаров [{id, imageUrl, title, url, domain, price}]
     */
    public function searchProducts(string $query): array
    {
        // Если ключи не настроены, возвращаем заглушку
        if (empty($this->apiKeySecret) || empty($this->folderId)) {
            return $this->getMockProductResults($query);
        }

        try {
            $searchQuery = $query . ' купить одежда';
            $results = $this->performImageSearch($searchQuery);
            
            return $results;

        } catch (\Exception $e) {
            Log::error('Yandex image search failed', ['error' => $e->getMessage()]);
            return $this->getMockProductResults($query);
        }
    }

    /**
     * Выполнение поиска изображений через Yandex Cloud Image Search API
     */
    private function performImageSearch(string $query): array
    {
        // Синхронный эндпоинт для Image Search
        $imageSearchUrl = 'https://searchapi.api.cloud.yandex.net/v2/image/search';
        
        $requestBody = [
            'query' => [
                'searchType' => 'SEARCH_TYPE_RU',
                'queryText' => $query,
                'familyMode' => 'FAMILY_MODE_MODERATE',
            ],
            'folderId' => $this->folderId,
            'responseFormat' => 'FORMAT_XML',
        ];
        
        Log::info('Image Search request', ['url' => $imageSearchUrl, 'body' => $requestBody]);
        
        $response = Http::timeout(30)->withHeaders([
            'Authorization' => 'Api-Key ' . $this->apiKeySecret,
            'Content-Type' => 'application/json',
        ])->post($imageSearchUrl, $requestBody);

        Log::info('Image Search response', ['status' => $response->status(), 'body_length' => strlen($response->body())]);

        if (!$response->successful()) {
            Log::warning('Yandex Image API error', [
                'status' => $response->status(),
                'body' => substr($response->body(), 0, 1000),
            ]);
            return [];
        }

        // Для синхронного API ответ содержит данные напрямую
        $responseData = $response->json();
        
        // Проверяем структуру ответа
        if (isset($responseData['rawData'])) {
            // Прямой ответ с данными
            $xml = base64_decode($responseData['rawData']);
            Log::info('Image XML received (direct)', ['xml_length' => strlen($xml)]);
            return $this->parseImageXmlResponse($xml);
        }
        
        // Если это асинхронная операция
        if (isset($responseData['id'])) {
            Log::info('Image Search operation started', ['operation' => $responseData]);
            return $this->getImageOperationResult($responseData['id']);
        }
        
        Log::warning('Unexpected response format', ['response' => $responseData]);
        return [];
    }

    /**
     * Получение результата асинхронной операции поиска изображений
     */
    private function getImageOperationResult(string $operationId): array
    {
        $maxAttempts = 10;
        $attempt = 0;

        while ($attempt < $maxAttempts) {
            $response = Http::withHeaders([
                'Authorization' => 'Api-Key ' . $this->apiKeySecret,
            ])->get("https://operation.api.cloud.yandex.net/operations/{$operationId}");

            if (!$response->successful()) {
                break;
            }

            $operation = $response->json();
            
            if (isset($operation['done']) && $operation['done']) {
                Log::info('Image operation completed', ['operation' => $operation]);
                
                if (isset($operation['response'])) {
                    $rawData = $operation['response']['rawData'] ?? '';
                    $xml = base64_decode($rawData);
                    Log::info('Image XML received', ['xml_length' => strlen($xml), 'xml_start' => substr($xml, 0, 500)]);
                    return $this->parseImageXmlResponse($xml);
                }
                
                if (isset($operation['error'])) {
                    Log::error('Image operation error', ['error' => $operation['error']]);
                }
                break;
            }

            $attempt++;
            usleep(500000); // 500ms
        }

        return [];
    }

    /**
     * Парсинг XML-ответа Yandex Image Search
     */
    private function parseImageXmlResponse(string $xml): array
    {
        $results = [];

        try {
            if (empty($xml)) {
                return [];
            }

            $doc = @simplexml_load_string($xml);
            
            if (!$doc) {
                Log::warning('Failed to parse image XML', ['xml' => substr($xml, 0, 1000)]);
                return [];
            }
            
            // Логируем структуру XML для отладки
            Log::info('Image XML parsed', ['groups' => count($doc->xpath('//group')), 'docs' => count($doc->xpath('//doc'))]);

            // Парсим результаты из XML формата Yandex Images
            $index = 0;
            foreach ($doc->xpath('//group/doc') as $docNode) {
                // Логируем первый документ для отладки структуры
                if ($index === 0) {
                    Log::info('First image doc structure', [
                        'xml' => $docNode->asXML(),
                        'children' => array_keys((array) $docNode),
                    ]);
                }
                
                // Пробуем разные варианты названий полей
                $imageUrl = (string) ($docNode->{'image-link'} ?? '');
                if (empty($imageUrl)) {
                    $imageUrl = (string) ($docNode->{'image_link'} ?? '');
                }
                if (empty($imageUrl)) {
                    $imageUrl = (string) ($docNode->{'img-link'} ?? '');
                }
                if (empty($imageUrl)) {
                    $imageUrl = (string) ($docNode->image ?? '');
                }
                
                $pageUrl = (string) ($docNode->url ?? '');
                $title = strip_tags((string) ($docNode->title ?? ''));
                $domain = parse_url($pageUrl, PHP_URL_HOST) ?: '';
                
                // Пропускаем если нет изображения
                if (empty($imageUrl)) {
                    if ($index < 3) {
                        Log::info('No image in doc', ['index' => $index, 'pageUrl' => $pageUrl]);
                    }
                    $index++;
                    continue;
                }
                
                $results[] = [
                    'id' => 'yandex-img-' . $index,
                    'imageUrl' => $imageUrl,
                    'title' => $title ?: 'Товар',
                    'url' => $pageUrl,
                    'domain' => str_replace('www.', '', $domain),
                    'price' => null,
                ];
                
                $index++;
                
                // Ограничиваем количество результатов
                if ($index >= 20) {
                    break;
                }
            }
        } catch (\Exception $e) {
            Log::error('Image XML parse error', ['error' => $e->getMessage()]);
        }

        return $results;
    }

    /**
     * Извлечение og:image из страницы товара
     *
     * @param string $url URL страницы
     * @return string|null URL изображения или null
     */
    private function extractOgImage(string $url): ?string
    {
        if (empty($url)) {
            return null;
        }

        try {
            $response = Http::timeout(3)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'text/html',
                ])
                ->get($url);

            if (!$response->successful()) {
                return null;
            }

            $html = $response->body();
            
            // Ищем og:image
            if (preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/', $html, $matches)) {
                return $matches[1];
            }
            
            // Альтернативный порядок атрибутов
            if (preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']/', $html, $matches)) {
                return $matches[1];
            }

            // Ищем twitter:image как fallback
            if (preg_match('/<meta[^>]+(?:name|property)=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']/', $html, $matches)) {
                return $matches[1];
            }

            return null;

        } catch (\Exception $e) {
            Log::debug('Failed to extract og:image', ['url' => $url, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Выполнение поискового запроса через Yandex Cloud Search API
     */
    private function performSearch(string $query): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Api-Key ' . $this->apiKeySecret,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl, [
            'query' => [
                'searchType' => 'SEARCH_TYPE_RU',
                'queryText' => $query,
            ],
            'folderId' => $this->folderId,
            'responseFormat' => 'FORMAT_XML',
            'userAgent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ]);

        if (!$response->successful()) {
            Log::warning('Yandex API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return [];
        }

        // API возвращает operation, нужно получить результат
        $operation = $response->json();
        
        if (!isset($operation['id'])) {
            return [];
        }

        // Получаем результат операции
        return $this->getOperationResult($operation['id']);
    }

    /**
     * Получение результата асинхронной операции
     */
    private function getOperationResult(string $operationId): array
    {
        $maxAttempts = 10;
        $attempt = 0;

        while ($attempt < $maxAttempts) {
            $response = Http::withHeaders([
                'Authorization' => 'Api-Key ' . $this->apiKeySecret,
            ])->get("https://operation.api.cloud.yandex.net/operations/{$operationId}");

            if (!$response->successful()) {
                break;
            }

            $operation = $response->json();
            
            if (isset($operation['done']) && $operation['done']) {
                if (isset($operation['response'])) {
                    return $this->parseXmlResponse(base64_decode($operation['response']['rawData'] ?? ''));
                }
                break;
            }

            $attempt++;
            usleep(500000); // 500ms
        }

        return [];
    }

    /**
     * Парсинг XML-ответа Yandex
     */
    private function parseXmlResponse(string $xml): array
    {
        $results = [];

        try {
            if (empty($xml)) {
                return [];
            }

            $doc = @simplexml_load_string($xml);
            
            if (!$doc) {
                return [];
            }

            // Парсим результаты из XML формата Yandex
            foreach ($doc->xpath('//group/doc') as $docNode) {
                $url = (string) ($docNode->url ?? '');
                $domain = parse_url($url, PHP_URL_HOST) ?: '';
                
                $results[] = [
                    'title' => strip_tags((string) ($docNode->title ?? '')),
                    'url' => $url,
                    'snippet' => strip_tags((string) ($docNode->passages->passage[0] ?? '')),
                    'domain' => str_replace('www.', '', $domain),
                    'imageUrl' => (string) ($docNode->{'passage-image'} ?? ''),
                ];
            }
        } catch (\Exception $e) {
            Log::error('XML parse error', ['error' => $e->getMessage()]);
        }

        return $results;
    }

    /**
     * Заглушка с популярными магазинами
     */
    private function getMockResults(string $query): array
    {
        return [
            [
                'title' => 'Wildberries — модная одежда и обувь',
                'url' => 'https://www.wildberries.ru/catalog/zhenshchinam/odezhda',
                'snippet' => 'Большой выбор женской одежды с бесплатной доставкой',
                'domain' => 'wildberries.ru',
            ],
            [
                'title' => 'Lamoda — интернет-магазин одежды',
                'url' => 'https://www.lamoda.ru/c/355/clothes-zhenskaya-odezhda/',
                'snippet' => 'Более 3 000 брендов. Бесплатная доставка и примерка',
                'domain' => 'lamoda.ru',
            ],
            [
                'title' => 'OZON — маркетплейс',
                'url' => 'https://www.ozon.ru/category/odezhda-obuv-i-aksessuary-7500/',
                'snippet' => 'Одежда, обувь и аксессуары с выгодой до 70%',
                'domain' => 'ozon.ru',
            ],
            [
                'title' => 'Zara — официальный сайт',
                'url' => 'https://www.zara.com/ru/',
                'snippet' => 'Новые коллекции и тренды сезона',
                'domain' => 'zara.com',
            ],
            [
                'title' => 'H&M — модная одежда',
                'url' => 'https://www2.hm.com/ru_ru/zhenshchiny.html',
                'snippet' => 'Устойчивая мода для всей семьи',
                'domain' => 'hm.com',
            ],
            [
                'title' => 'LIME — российский бренд',
                'url' => 'https://lime-shop.com/ru_ru/women',
                'snippet' => 'Современная женская одежда',
                'domain' => 'lime-shop.com',
            ],
        ];
    }

    /**
     * Mock-данные товаров с картинками для тестирования
     */
    private function getMockProductResults(string $query): array
    {
        return [
            [
                'id' => 'yandex-1',
                'imageUrl' => 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=600&fit=crop',
                'title' => 'Элегантное платье',
                'url' => 'https://www.lamoda.ru/p/mp002xw0q1j6/clothes-love-republic-plate/',
                'domain' => 'lamoda.ru',
                'price' => '4 990 ₽',
            ],
            [
                'id' => 'yandex-2',
                'imageUrl' => 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=600&fit=crop',
                'title' => 'Джинсовая куртка',
                'url' => 'https://www.wildberries.ru/catalog/12345678/detail.aspx',
                'domain' => 'wildberries.ru',
                'price' => '3 299 ₽',
            ],
            [
                'id' => 'yandex-3',
                'imageUrl' => 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=600&fit=crop',
                'title' => 'Кожаная куртка',
                'url' => 'https://www.zara.com/ru/ru/kozhannaya-kurtka-p00706305.html',
                'domain' => 'zara.com',
                'price' => '12 990 ₽',
            ],
            [
                'id' => 'yandex-4',
                'imageUrl' => 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=600&fit=crop',
                'title' => 'Летнее платье макси',
                'url' => 'https://www.ozon.ru/product/plate-zhenskoe-123456/',
                'domain' => 'ozon.ru',
                'price' => '2 499 ₽',
            ],
            [
                'id' => 'yandex-5',
                'imageUrl' => 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=600&fit=crop',
                'title' => 'Блейзер оверсайз',
                'url' => 'https://lime-shop.com/ru_ru/product/blayzer-oversize',
                'domain' => 'lime-shop.com',
                'price' => '7 990 ₽',
            ],
            [
                'id' => 'yandex-6',
                'imageUrl' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
                'title' => 'Классические брюки',
                'url' => 'https://www2.hm.com/ru_ru/productpage.html',
                'domain' => 'hm.com',
                'price' => '1 999 ₽',
            ],
            [
                'id' => 'yandex-7',
                'imageUrl' => 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop',
                'title' => 'Вечернее платье',
                'url' => 'https://www.lamoda.ru/p/evening-dress/',
                'domain' => 'lamoda.ru',
                'price' => '8 990 ₽',
            ],
            [
                'id' => 'yandex-8',
                'imageUrl' => 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=600&fit=crop',
                'title' => 'Пуховик зимний',
                'url' => 'https://www.wildberries.ru/catalog/87654321/detail.aspx',
                'domain' => 'wildberries.ru',
                'price' => '9 499 ₽',
            ],
        ];
    }
}
