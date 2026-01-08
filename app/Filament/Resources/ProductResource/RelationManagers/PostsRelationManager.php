<?php

namespace App\Filament\Resources\ProductResource\RelationManagers;

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
                    ->required(),
                Forms\Components\TextInput::make('author_name')
                    ->label('Ник автора')
                    ->maxLength(255),
                Forms\Components\TextInput::make('title')
                    ->label('Заголовок')
                    ->maxLength(255),
                Forms\Components\Toggle::make('is_private')
                    ->label('Приватная'),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('title')
            ->columns([
                Tables\Columns\ImageColumn::make('image_url')
                    ->label('Фото')
                    ->circular()
                    ->size(60),
                Tables\Columns\TextColumn::make('author_name')
                    ->label('Ник')
                    ->searchable(),
                Tables\Columns\TextColumn::make('id')
                    ->label('Ссылка')
                    ->formatStateUsing(fn ($state) => "Публикация #{$state}")
                    ->url(fn ($record) => route('filament.admin.resources.posts.edit', ['record' => $record]))
                    ->openUrlInNewTab(),
                Tables\Columns\TextColumn::make('likes')
                    ->label('Лайки')
                    ->numeric(),
                Tables\Columns\IconColumn::make('is_private')
                    ->label('Приватная')
                    ->boolean(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Дата')
                    ->dateTime()
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
            ]);
    }
}
