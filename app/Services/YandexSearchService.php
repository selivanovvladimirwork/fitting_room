<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class YandexSearchService
{
    private string $user;
    private string $key;
    private string $baseUrl = 'https://yandex.ru/search/xml';

    public function __construct()
    {
        $this->user = config('services.yandex.user', '');
        $this->key = config('services.yandex.key', '');
    }

    /**
     * Поиск магазинов через Yandex XML API
     *
     * @param string $query Поисковый запрос
     * @return array Массив результатов [{title, url, snippet, domain}]
     */
    public function searchShops(string $query): array
    {
        // Если ключи не настроены, возвращаем заглушку
        if (empty($this->user) || empty($this->key)) {
            return $this->getMockResults($query);
        }

        try {
            // Добавляем "магазин" к запросу для релевантности
            $searchQuery = $query . ' магазин купить';
            
            $response = Http::get($this->baseUrl, [
                'user' => $this->user,
                'key' => $this->key,
                'query' => $searchQuery,
                'l10n' => 'ru',
                'sortby' => 'rlv',
                'filter' => 'strict',
                'groupby' => 'attr=d.mode=deep.groups-on-page=10.docs-in-group=1',
            ]);

            if ($response->successful()) {
                return $this->parseXmlResponse($response->body());
            }

            Log::warning('Yandex API error', ['status' => $response->status()]);
            return $this->getMockResults($query);

        } catch (\Exception $e) {
            Log::error('Yandex search failed', ['error' => $e->getMessage()]);
            return $this->getMockResults($query);
        }
    }

    /**
     * Парсинг XML-ответа Yandex
     */
    private function parseXmlResponse(string $xml): array
    {
        $results = [];

        try {
            $doc = simplexml_load_string($xml);
            
            if (!$doc || !isset($doc->response->results->grouping->group)) {
                return [];
            }

            foreach ($doc->response->results->grouping->group as $group) {
                if (!isset($group->doc)) continue;
                
                $doc = $group->doc;
                $url = (string) $doc->url;
                $domain = parse_url($url, PHP_URL_HOST) ?: '';
                
                $results[] = [
                    'title' => strip_tags((string) $doc->title),
                    'url' => $url,
                    'snippet' => strip_tags((string) ($doc->passages->passage[0] ?? '')),
                    'domain' => str_replace('www.', '', $domain),
                ];
            }
        } catch (\Exception $e) {
            Log::error('XML parse error', ['error' => $e->getMessage()]);
        }

        return $results;
    }

    /**
     * Заглушка с популярными магазинами (для тестирования без API-ключа)
     */
    private function getMockResults(string $query): array
    {
        $queryLower = mb_strtolower($query);
        
        $allShops = [
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

        // Фильтруем результаты по запросу
        return array_values(array_filter($allShops, function ($shop) use ($queryLower) {
            return mb_strpos(mb_strtolower($shop['title']), $queryLower) !== false ||
                   mb_strpos(mb_strtolower($shop['domain']), $queryLower) !== false ||
                   mb_strpos(mb_strtolower($shop['snippet']), $queryLower) !== false ||
                   true; // Возвращаем все, если совпадений нет
        }));
    }

    /**
     * Поиск товаров с картинками через Yandex
     *
     * @param string $query Поисковый запрос
     * @return array Массив товаров [{id, imageUrl, title, url, domain, price}]
     */
    public function searchProducts(string $query): array
    {
        // Пока используем mock-данные с реальными картинками
        // В будущем можно подключить Yandex Images API
        return $this->getMockProductResults($query);
    }

    /**
     * Mock-данные товаров с картинками для тестирования
     */
    private function getMockProductResults(string $query): array
    {
        $queryLower = mb_strtolower($query);
        
        // Товары с реальными картинками (placeholder images)
        $products = [
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

        // Фильтруем по запросу (простой поиск)
        if (!empty($queryLower) && $queryLower !== 'все' && $queryLower !== 'all') {
            $products = array_filter($products, function ($p) use ($queryLower) {
                return mb_strpos(mb_strtolower($p['title']), $queryLower) !== false ||
                       mb_strpos(mb_strtolower($p['domain']), $queryLower) !== false;
            });
        }

        return array_values($products);
    }
}

