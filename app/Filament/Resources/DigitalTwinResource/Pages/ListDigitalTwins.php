<?php

namespace App\Filament\Resources\DigitalTwinResource\Pages;

use App\Filament\Resources\DigitalTwinResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListDigitalTwins extends ListRecords
{
    protected static string $resource = DigitalTwinResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
