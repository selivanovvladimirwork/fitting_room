<?php

namespace App\Filament\Pages;

use App\Models\AiApiSetting;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Pages\Page;

class AiApiSettings extends Page implements HasForms
{
    use InteractsWithForms;
    
    protected static ?string $navigationIcon = 'heroicon-o-cpu-chip';
    
    protected static ?string $navigationLabel = 'API';
    
    protected static ?string $navigationGroup = 'Настройки';
    
    protected static ?string $title = 'Настройки API';
    
    protected static ?int $navigationSort = 99;

    protected static string $view = 'filament.pages.ai-api-settings';
    
    public ?array $data = [];
    
    public function mount(): void
    {
        $settings = AiApiSetting::getInstance();
        $this->form->fill([
            'api_key' => $settings->api_key,
        ]);
    }
    
    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Section::make('API ключ для генерации')
                    ->description('Единый ключ для генерации фото и видео (OpenRouter)')
                    ->schema([
                        TextInput::make('api_key')
                            ->label('API ключ')
                            ->password()
                            ->revealable()
                            ->placeholder('sk-...'),
                    ]),
            ])
            ->statePath('data');
    }
    
    public function save(): void
    {
        $settings = AiApiSetting::getInstance();
        $settings->update($this->form->getState());
        
        Notification::make()
            ->title('Настройки сохранены')
            ->success()
            ->send();
    }
    
    public function getSettings(): AiApiSetting
    {
        return AiApiSetting::getInstance();
    }
}

