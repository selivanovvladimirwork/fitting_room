<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ShopResource\Pages;
use App\Filament\Resources\ShopResource\RelationManagers;
use App\Models\Shop;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ShopResource extends Resource
{
    protected static ?string $model = Shop::class;

    protected static ?string $navigationIcon = 'heroicon-o-building-storefront';
    
    protected static ?string $modelLabel = 'Магазин';
    
    protected static ?string $pluralModelLabel = 'Магазины';
    
    protected static ?string $navigationLabel = 'Магазины';
    
    protected static ?string $navigationGroup = 'Каталог';
    
    protected static ?int $navigationSort = 1; // Магазины первые в группе "Каталог"

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Основная информация')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('Название')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('slug')
                            ->label('URL-slug')
                            ->helperText('Для ссылки на страницу магазина')
                            ->unique(ignoreRecord: true)
                            ->maxLength(255),
                        Forms\Components\TextInput::make('domain')
                            ->label('Домен')
                            ->helperText('Например: ozon.ru')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('external_url')
                            ->label('Ссылка на магазин')
                            ->url()
                            ->maxLength(500),
                    ])->columns(2),
                    
                Forms\Components\Section::make('Оформление')
                    ->description('Логотип и описание отображаются на странице магазина')
                    ->schema([
                        Forms\Components\FileUpload::make('logo_url')
                            ->label('Логотип')
                            ->image()
                            ->directory('shops'),
                        Forms\Components\Textarea::make('description')
                            ->label('Описание')
                            ->rows(3),
                    ]),
                    
                Forms\Components\Section::make('Настройки отображения')
                    ->description('Популярные магазины отображаются на главной странице')
                    ->schema([
                        Forms\Components\Toggle::make('is_popular')
                            ->label('Показывать на главной'),
                        Forms\Components\TextInput::make('sort_order')
                            ->label('Порядок сортировки')
                            ->helperText('Меньше = выше в списке')
                            ->numeric()
                            ->default(0),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('logo_url')
                    ->label('Лого')
                    ->circular()
                    ->size(40),
                Tables\Columns\TextColumn::make('name')
                    ->label('Название')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('domain')
                    ->label('Домен')
                    ->searchable(),
                Tables\Columns\TextColumn::make('products_count')
                    ->label('Товаров')
                    ->counts('products')
                    ->sortable(),
                Tables\Columns\TextColumn::make('posts_count')
                    ->label('Постов')
                    ->counts('posts')
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_popular')
                    ->label('Популярный')
                    ->boolean(),
                Tables\Columns\TextColumn::make('sort_order')
                    ->label('Порядок')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Создан')
                    ->dateTime('d.m.Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('sort_order')
            ->filters([
                Tables\Filters\TernaryFilter::make('is_popular')
                    ->label('Популярный'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            RelationManagers\ProductsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListShops::route('/'),
            'create' => Pages\CreateShop::route('/create'),
            'edit' => Pages\EditShop::route('/{record}/edit'),
        ];
    }
}
