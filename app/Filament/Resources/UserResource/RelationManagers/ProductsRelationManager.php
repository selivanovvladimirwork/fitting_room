<?php

namespace App\Filament\Resources\UserResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class ProductsRelationManager extends RelationManager
{
    protected static string $relationship = 'products';
    
    protected static ?string $title = 'Примерочная (гардероб)';
    
    protected static ?string $modelLabel = 'Товар';
    
    protected static ?string $pluralModelLabel = 'Товары';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\FileUpload::make('images')
                    ->label('Изображение')
                    ->image()
                    ->directory('wardrobe')
                    ->multiple(),
                Forms\Components\TextInput::make('name_ru')
                    ->label('Название')
                    ->maxLength(255),
                Forms\Components\TextInput::make('brand')
                    ->label('Бренд/Магазин')
                    ->maxLength(100),
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
                    ->label('Изображение')
                    ->square()
                    ->size(80)
                    ->getStateUsing(fn ($record) => $record->images[0] ?? null),
                Tables\Columns\TextColumn::make('name_ru')
                    ->label('Название')
                    ->limit(30)
                    ->searchable(),
                Tables\Columns\TextColumn::make('brand')
                    ->label('Бренд/Магазин')
                    ->limit(20)
                    ->searchable(),
                Tables\Columns\TextColumn::make('store_url')
                    ->label('Ссылка')
                    ->limit(30)
                    ->url(fn ($record) => $record->store_url, shouldOpenInNewTab: true),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Добавлено')
                    ->dateTime('d.m.Y H:i')
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
