<?php

namespace App\Filament\Resources\UserResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class PostsRelationManager extends RelationManager
{
    protected static string $relationship = 'posts';
    
    protected static ?string $title = 'Публикации';
    
    protected static ?string $modelLabel = 'Публикация';
    
    protected static ?string $pluralModelLabel = 'Публикации';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\FileUpload::make('image_url')
                    ->label('Изображение')
                    ->image()
                    ->directory('posts'),
                Forms\Components\TextInput::make('title')
                    ->label('Название')
                    ->maxLength(255),
                Forms\Components\Toggle::make('is_private')
                    ->label('Приватный'),
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
                Tables\Columns\IconColumn::make('is_private')
                    ->label('Приватный')
                    ->boolean(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Создано')
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
