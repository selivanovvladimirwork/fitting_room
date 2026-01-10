<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProductResource\Pages;
use App\Filament\Resources\ProductResource\RelationManagers;
use App\Models\Product;
use App\Models\Shop;
use App\Models\Brand;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class ProductResource extends Resource
{
    protected static ?string $model = Product::class;

    protected static ?string $navigationIcon = 'heroicon-o-shopping-bag';
    
    protected static ?string $modelLabel = 'Товар';
    
    protected static ?string $pluralModelLabel = 'Товары';
    
    protected static ?string $navigationLabel = 'Товары';
    
    protected static ?string $navigationGroup = 'Каталог';
    
    protected static ?int $navigationSort = 3; // После магазинов и брендов

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Основная информация')
                    ->schema([
                        Forms\Components\TextInput::make('name_ru')
                            ->label('Название')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\Select::make('shop_id')
                            ->label('Магазин')
                            ->relationship('shop', 'name')
                            ->searchable()
                            ->preload()
                            ->createOptionForm([
                                Forms\Components\TextInput::make('name')
                                    ->label('Название')
                                    ->required(),
                                Forms\Components\TextInput::make('domain')
                                    ->label('Домен'),
                            ]),
                        Forms\Components\Select::make('brand_id')
                            ->label('Бренд')
                            ->relationship('brandRelation', 'name')
                            ->searchable()
                            ->preload()
                            ->createOptionForm([
                                Forms\Components\TextInput::make('name')
                                    ->label('Название')
                                    ->required(),
                            ]),
                        Forms\Components\TextInput::make('brand')
                            ->label('Бренд (текст)')
                            ->helperText('Используется если бренд не выбран из списка')
                            ->maxLength(255),
                    ])->columns(2),
                    
                Forms\Components\Section::make('Изображения и ссылка')
                    ->schema([
                        Forms\Components\FileUpload::make('images')
                            ->label('Изображения')
                            ->multiple()
                            ->reorderable()
                            ->image()
                            ->imageEditor()
                            ->directory('products'),
                        Forms\Components\TextInput::make('store_url')
                            ->label('Ссылка на товар')
                            ->url()
                            ->maxLength(500),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('images')
                    ->label('Фото')
                    ->square()
                    ->size(50)
                    ->getStateUsing(fn ($record) => $record->images[0] ?? null),
                Tables\Columns\TextColumn::make('name_ru')
                    ->label('Название')
                    ->searchable()
                    ->sortable()
                    ->limit(40),
                Tables\Columns\TextColumn::make('shop.name')
                    ->label('Магазин')
                    ->sortable(),
                Tables\Columns\TextColumn::make('brandRelation.name')
                    ->label('Бренд')
                    ->sortable(),
                Tables\Columns\TextColumn::make('brand')
                    ->label('Бренд (текст)')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('store_url')
                    ->label('Ссылка')
                    ->limit(25)
                    ->url(fn ($record) => $record->store_url, shouldOpenInNewTab: true)
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Создан')
                    ->dateTime('d.m.Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('shop_id')
                    ->label('Магазин')
                    ->relationship('shop', 'name'),
                Tables\Filters\SelectFilter::make('brand_id')
                    ->label('Бренд')
                    ->relationship('brandRelation', 'name'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
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
            RelationManagers\PostsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListProducts::route('/'),
            'create' => Pages\CreateProduct::route('/create'),
            'edit' => Pages\EditProduct::route('/{record}/edit'),
        ];
    }
}
