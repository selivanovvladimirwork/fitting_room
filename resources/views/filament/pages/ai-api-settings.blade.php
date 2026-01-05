<x-filament-panels::page>
    <form wire:submit="save" class="space-y-6">
        {{ $this->form }}
        
        <div class="flex gap-4">
            <x-filament::button type="submit">
                Сохранить
            </x-filament::button>
        </div>
    </form>
    
    <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Статистика фото -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 class="text-lg font-semibold mb-4 dark:text-white">Статистика фото</h3>
            <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">Использовано токенов:</span>
                <span class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ number_format($this->getSettings()->photo_tokens_used) }}
                </span>
            </div>
        </div>
        
        <!-- Статистика видео -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 class="text-lg font-semibold mb-4 dark:text-white">Статистика видео</h3>
            <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">Использовано токенов:</span>
                <span class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ number_format($this->getSettings()->video_tokens_used) }}
                </span>
            </div>
        </div>
    </div>
</x-filament-panels::page>
