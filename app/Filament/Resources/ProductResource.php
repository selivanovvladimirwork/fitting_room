<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProductResource\Pages;
use App\Filament\Resources\ProductResource\RelationManagers;
use App\Models\Product;
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

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('name')
                    ->label('Название (EN)')
                    ->required()
                    ->maxLength(255),
                Forms\Components\TextInput::make('name_ru')
                    ->label('Название (RU)')
                    ->maxLength(255),
                Forms\Components\TextInput::make('brand')
                    ->label('Бренд')
                    ->maxLength(255),
                Forms\Components\TextInput::make('price')
                    ->label('Цена')
                    ->required()
                    ->numeric()
                    ->default(0.00)
                    ->prefix('₽'),
                Forms\Components\FileUpload::make('image_url')
                    ->label('Изображение')
                    ->image(),
                Forms\Components\TextInput::make('store_url')
                    ->label('Ссылка на магазин')
                    ->maxLength(255),
                Forms\Components\Select::make('category_id')
                    ->label('Категория')
                    ->relationship('category', 'name'),
                Forms\Components\Toggle::make('is_active')
                    ->label('Активен')
                    ->required(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable(),
                Tables\Columns\TextColumn::make('name_ru')
                    ->searchable(),
                Tables\Columns\TextColumn::make('brand')
                    ->searchable(),
                Tables\Columns\TextColumn::make('price')
                    ->money()
                    ->sortable(),
                Tables\Columns\ImageColumn::make('image_url'),
                Tables\Columns\TextColumn::make('store_url')
                    ->searchable(),
                Tables\Columns\TextColumn::make('category.name')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_active')
                    ->boolean(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
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
            //
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
