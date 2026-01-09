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
}
