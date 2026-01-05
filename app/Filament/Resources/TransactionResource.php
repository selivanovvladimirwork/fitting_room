<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TransactionResource\Pages;
use App\Filament\Resources\TransactionResource\RelationManagers;
use App\Models\Transaction;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class TransactionResource extends Resource
{
    protected static ?string $model = Transaction::class;

    protected static ?string $navigationIcon = 'heroicon-o-banknotes';
    
    protected static ?string $modelLabel = 'Транзакция';
    
    protected static ?string $pluralModelLabel = 'Транзакции';
    
    protected static ?string $navigationLabel = 'История платежей';
    
    protected static ?string $navigationGroup = 'Подписки';
    
    protected static ?int $navigationSort = 3;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('user_id')
                    ->label('Пользователь')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->required(),
                Forms\Components\Select::make('subscription_id')
                    ->label('Подписка')
                    ->relationship('subscription', 'id'),
                Forms\Components\TextInput::make('amount')
                    ->label('Сумма')
                    ->required()
                    ->numeric()
                    ->prefix('₽'),
                Forms\Components\Select::make('status')
                    ->label('Статус')
                    ->options([
                        'success' => 'Успешно',
                        'pending' => 'Ожидание',
                        'failed' => 'Ошибка',
                    ])
                    ->required()
                    ->default('pending'),
                Forms\Components\Select::make('payment_method')
                    ->label('Способ оплаты')
                    ->options([
                        'sberpay' => 'СберПэй',
                        'mir' => 'МИР',
                        'tbank' => 'Т-Банк',
                        'sbp' => 'СБП',
                    ]),
                Forms\Components\TextInput::make('external_id')
                    ->label('ID платежа')
                    ->maxLength(255),
                Forms\Components\Textarea::make('description')
                    ->label('Описание')
                    ->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('subscription.id')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('amount')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->searchable(),
                Tables\Columns\TextColumn::make('payment_method')
                    ->searchable(),
                Tables\Columns\TextColumn::make('external_id')
                    ->searchable(),
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
            'index' => Pages\ListTransactions::route('/'),
            'create' => Pages\CreateTransaction::route('/create'),
            'edit' => Pages\EditTransaction::route('/{record}/edit'),
        ];
    }
}
