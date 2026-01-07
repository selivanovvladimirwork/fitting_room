<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DigitalTwinResource\Pages;
use App\Filament\Resources\DigitalTwinResource\RelationManagers;
use App\Models\DigitalTwin;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class DigitalTwinResource extends Resource
{
    protected static ?string $model = DigitalTwin::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-circle';
    
    protected static ?string $modelLabel = 'Цифровой двойник';
    
    protected static ?string $pluralModelLabel = 'Цифровые двойники';
    
    protected static ?string $navigationLabel = 'Цифровые двойники';

    protected static bool $shouldRegisterNavigation = false;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('user_id')
                    ->label('Пользователь')
                    ->relationship('user', 'name')
                    ->required(),
                Forms\Components\TextInput::make('name')
                    ->label('Название')
                    ->required()
                    ->maxLength(255),
                Forms\Components\FileUpload::make('image_url')
                    ->label('Изображение')
                    ->image(),
                Forms\Components\TextInput::make('height')
                    ->label('Рост (см)')
                    ->numeric(),
                Forms\Components\TextInput::make('weight')
                    ->label('Вес (кг)')
                    ->numeric(),
                Forms\Components\TextInput::make('chest')
                    ->label('Грудь (см)')
                    ->numeric(),
                Forms\Components\TextInput::make('waist')
                    ->label('Талия (см)')
                    ->numeric(),
                Forms\Components\TextInput::make('hips')
                    ->label('Бёдра (см)')
                    ->numeric(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('name')
                    ->searchable(),
                Tables\Columns\ImageColumn::make('image_url'),
                Tables\Columns\TextColumn::make('height')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('weight')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('chest')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('waist')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('hips')
                    ->numeric()
                    ->sortable(),
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
            'index' => Pages\ListDigitalTwins::route('/'),
            'create' => Pages\CreateDigitalTwin::route('/create'),
            'edit' => Pages\EditDigitalTwin::route('/{record}/edit'),
        ];
    }
}
