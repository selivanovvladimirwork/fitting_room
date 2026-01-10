<?php

namespace App\Filament\Resources\UserResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class SavedLooksRelationManager extends RelationManager
{
    protected static string $relationship = 'savedLooks';
    
    protected static ?string $title = 'Сохранённые образы';
    
    protected static ?string $modelLabel = 'Образ';
    
    protected static ?string $pluralModelLabel = 'Сохранённые образы';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\FileUpload::make('image_url')
                    ->label('Изображение')
                    ->image()
                    ->directory('saved-looks'),
                Forms\Components\TextInput::make('title')
                    ->label('Название')
                    ->maxLength(255),
                Forms\Components\TextInput::make('brand')
                    ->label('Бренд')
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
            ->recordTitleAttribute('title')
            ->columns([
                Tables\Columns\ImageColumn::make('image_url')
                    ->label('Изображение')
                    ->square()
                    ->size(80),
                Tables\Columns\TextColumn::make('title')
                    ->label('Название')
                    ->limit(30)
                    ->searchable(),
                Tables\Columns\TextColumn::make('brand')
                    ->label('Бренд')
                    ->limit(20),
                Tables\Columns\TextColumn::make('store_url')
                    ->label('Ссылка')
                    ->limit(30)
                    ->url(fn ($record) => $record->store_url, shouldOpenInNewTab: true),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Сохранено')
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
