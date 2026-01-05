<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PostResource\Pages;
use App\Filament\Resources\PostResource\RelationManagers;
use App\Models\Post;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class PostResource extends Resource
{
    protected static ?string $model = Post::class;

    protected static ?string $navigationIcon = 'heroicon-o-photo';
    
    protected static ?string $modelLabel = 'Публикация';
    
    protected static ?string $pluralModelLabel = 'Публикации';
    
    protected static ?string $navigationLabel = 'Публикации';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('user_id')
                    ->label('Пользователь')
                    ->relationship('user', 'name'),
                Forms\Components\TextInput::make('title')
                    ->label('Заголовок')
                    ->maxLength(255),
                Forms\Components\FileUpload::make('image_url')
                    ->label('Изображение')
                    ->image(),
                Forms\Components\TextInput::make('author_name')
                    ->label('Имя автора')
                    ->maxLength(255),
                Forms\Components\TextInput::make('likes')
                    ->label('Лайки')
                    ->required()
                    ->numeric()
                    ->default(0),
                Forms\Components\Toggle::make('is_private')
                    ->label('Приватная')
                    ->required(),
                Forms\Components\TextInput::make('tags')
                    ->label('Теги'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('title')
                    ->searchable(),
                Tables\Columns\ImageColumn::make('image_url'),
                Tables\Columns\TextColumn::make('author_name')
                    ->searchable(),
                Tables\Columns\TextColumn::make('likes')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_private')
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
            'index' => Pages\ListPosts::route('/'),
            'create' => Pages\CreatePost::route('/create'),
            'edit' => Pages\EditPost::route('/{record}/edit'),
        ];
    }
}
