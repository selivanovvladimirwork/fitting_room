<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;
use Illuminate\Support\Facades\File;

class Logs extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-document-text';
    
    protected static ?string $navigationLabel = 'Логи';
    
    protected static ?string $navigationGroup = 'Настройки';
    
    protected static ?string $title = 'Логи';
    
    protected static ?int $navigationSort = 100;

    protected static string $view = 'filament.pages.logs';
    
    public string $selectedDate = '';
    public string $logContent = '';
    public array $availableDates = [];
    
    public function mount(): void
    {
        $this->loadAvailableDates();
        if (!empty($this->availableDates)) {
            $this->selectedDate = $this->availableDates[0];
            $this->loadLog();
        }
    }
    
    public function loadAvailableDates(): void
    {
        $logPath = storage_path('logs');
        $files = File::glob($logPath . '/laravel-*.log');
        
        $this->availableDates = collect($files)
            ->map(function ($file) {
                preg_match('/laravel-(\d{4}-\d{2}-\d{2})\.log/', $file, $matches);
                return $matches[1] ?? null;
            })
            ->filter()
            ->sortDesc()
            ->values()
            ->toArray();
            
        // Also check for laravel.log
        if (File::exists($logPath . '/laravel.log')) {
            array_unshift($this->availableDates, 'today');
        }
    }
    
    public function loadLog(): void
    {
        if (empty($this->selectedDate)) {
            $this->logContent = 'Нет логов';
            return;
        }
        
        $logPath = storage_path('logs');
        
        if ($this->selectedDate === 'today') {
            $file = $logPath . '/laravel.log';
        } else {
            $file = $logPath . '/laravel-' . $this->selectedDate . '.log';
        }
        
        if (File::exists($file)) {
            $content = File::get($file);
            // Get last 500 lines
            $lines = explode("\n", $content);
            $this->logContent = implode("\n", array_slice($lines, -500));
        } else {
            $this->logContent = 'Файл не найден';
        }
    }
    
    public function updatedSelectedDate(): void
    {
        $this->loadLog();
    }
}
