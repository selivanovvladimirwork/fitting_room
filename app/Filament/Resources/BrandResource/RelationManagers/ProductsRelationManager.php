<?php

namespace App\Filament\Resources\BrandResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class ProductsRelationManager extends RelationManager
{
    protected static string $relationship = 'products';
    
    protected static ?string $title = 'Товары бренда';
    
    protected static ?string $modelLabel = 'Товар';
    
    protected static ?string $pluralModelLabel = 'Товары';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\FileUpload::make('images')
                    ->label('Изображения')
                    ->image()
                    ->directory('products')
                    ->multiple()
                    ->reorderable(),
                Forms\Components\TextInput::make('name_ru')
                    ->label('Название')
                    ->required()
                    ->maxLength(255),
                Forms\Components\TextInput::make('store_url')
                    ->label('Ссылка на товар')
                    ->url()
                    ->maxLength(500),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('name_ru')
            ->columns([
                Tables\Columns\ImageColumn::make('images')
                    ->label('Фото')
                    ->square()
                    ->size(60)
                    ->getStateUsing(fn ($record) => $record->images[0] ?? null),
                Tables\Columns\TextColumn::make('name_ru')
                    ->label('Название')
                    ->searchable()
                    ->limit(40),
                Tables\Columns\TextColumn::make('shop.name')
                    ->label('Магазин'),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Добавлен')
                    ->dateTime('d.m.Y')
                    ->sortable(),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                Tables\Actions\CreateAction::make(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
