<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;

class ApiDocumentation extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-book-open';
    
    protected static ?string $navigationLabel = 'Документация';
    
    protected static ?string $title = 'API Документация';
    
    protected static ?int $navigationSort = 101;

    protected static string $view = 'filament.pages.api-documentation';
    
    public array $endpoints = [];
    
    public function mount(): void
    {
        $this->endpoints = [
            [
                'method' => 'GET',
                'path' => '/api/categories',
                'description' => 'Получить список категорий',
                'params' => [],
                'response' => '{"data": [{"id": 1, "name": "...", "slug": "..."}]}'
            ],
            [
                'method' => 'GET',
                'path' => '/api/categories/{id}',
                'description' => 'Получить категорию по ID',
                'params' => ['id' => 'ID категории'],
                'response' => '{"data": {"id": 1, "name": "...", "slug": "..."}}'
            ],
            [
                'method' => 'POST',
                'path' => '/api/categories',
                'description' => 'Создать категорию',
                'params' => ['name' => 'Название', 'slug' => 'Ярлык', 'description' => 'Описание'],
                'response' => '{"data": {"id": 1, "name": "..."}}'
            ],
            [
                'method' => 'GET',
                'path' => '/api/products',
                'description' => 'Получить список товаров',
                'params' => ['category_id' => 'Фильтр по категории (опц.)'],
                'response' => '{"data": [{"id": 1, "name": "...", "price": 100}]}'
            ],
            [
                'method' => 'GET',
                'path' => '/api/products/{id}',
                'description' => 'Получить товар по ID',
                'params' => ['id' => 'ID товара'],
                'response' => '{"data": {"id": 1, "name": "...", "price": 100}}'
            ],
            [
                'method' => 'POST',
                'path' => '/api/products',
                'description' => 'Создать товар',
                'params' => ['name' => 'Название', 'price' => 'Цена', 'category_id' => 'ID категории'],
                'response' => '{"data": {"id": 1, "name": "..."}}'
            ],
            [
                'method' => 'GET',
                'path' => '/api/digital-twins',
                'description' => 'Получить список цифровых двойников',
                'params' => ['user_id' => 'Фильтр по пользователю (опц.)'],
                'response' => '{"data": [{"id": 1, "name": "...", "height": 170}]}'
            ],
            [
                'method' => 'POST',
                'path' => '/api/digital-twins',
                'description' => 'Создать цифрового двойника',
                'params' => ['user_id' => 'ID пользователя', 'name' => 'Название', 'height' => 'Рост', 'weight' => 'Вес'],
                'response' => '{"data": {"id": 1, "name": "..."}}'
            ],
            [
                'method' => 'GET',
                'path' => '/api/posts',
                'description' => 'Получить список публикаций',
                'params' => [],
                'response' => '{"data": [{"id": 1, "title": "...", "likes": 10}]}'
            ],
            [
                'method' => 'POST',
                'path' => '/api/posts',
                'description' => 'Создать публикацию',
                'params' => ['title' => 'Заголовок', 'user_id' => 'ID пользователя'],
                'response' => '{"data": {"id": 1, "title": "..."}}'
            ],
        ];
    }
}
