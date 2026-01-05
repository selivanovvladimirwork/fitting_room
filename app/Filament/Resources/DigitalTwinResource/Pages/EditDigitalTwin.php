<?php

namespace App\Filament\Resources\DigitalTwinResource\Pages;

use App\Filament\Resources\DigitalTwinResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditDigitalTwin extends EditRecord
{
    protected static string $resource = DigitalTwinResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
