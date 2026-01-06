<?php

namespace App\Filament\Resources\UserResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class DigitalTwinsRelationManager extends RelationManager
{
    protected static string $relationship = 'digitalTwins';
    
    protected static ?string $title = 'Цифровые двойники';
    
    protected static ?string $modelLabel = 'Цифровой двойник';
    
    protected static ?string $pluralModelLabel = 'Цифровые двойники';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('name')
                    ->label('Имя аватара')
                    ->required()
                    ->maxLength(255),
                Forms\Components\FileUpload::make('image_url')
                    ->label('Изображение')
                    ->image()
                    ->directory('avatars'),
                Forms\Components\Section::make('Параметры тела')
                    ->schema([
                        Forms\Components\TextInput::make('height')
                            ->label('Рост (см)')
                            ->numeric()
                            ->minValue(100)
                            ->maxValue(250),
                        Forms\Components\TextInput::make('weight')
                            ->label('Вес (кг)')
                            ->numeric()
                            ->minValue(30)
                            ->maxValue(300),
                        Forms\Components\TextInput::make('chest')
                            ->label('Грудь (см)')
                            ->numeric(),
                        Forms\Components\TextInput::make('waist')
                            ->label('Талия (см)')
                            ->numeric(),
                        Forms\Components\TextInput::make('hips')
                            ->label('Бедра (см)')
                            ->numeric(),
                    ])->columns(5),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('name')
            ->columns([
                Tables\Columns\ImageColumn::make('image_url')
                    ->label('Фото')
                    ->circular(),
                Tables\Columns\TextColumn::make('name')
                    ->label('Имя')
                    ->searchable(),
                Tables\Columns\TextColumn::make('height')
                    ->label('Рост')
                    ->suffix(' см'),
                Tables\Columns\TextColumn::make('weight')
                    ->label('Вес')
                    ->suffix(' кг'),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Создан')
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
            ]);
    }
}
