<x-filament-panels::page>
    <div class="space-y-4">
        <div class="flex items-center gap-4">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Выберите дату:</label>
            <select wire:model.live="selectedDate" class="rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                @foreach($availableDates as $date)
                    <option value="{{ $date }}">
                        {{ $date === 'today' ? 'Сегодня (laravel.log)' : $date }}
                    </option>
                @endforeach
            </select>
        </div>
        
        @if(empty($availableDates))
            <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p class="text-yellow-800 dark:text-yellow-200">Лог-файлы не найдены</p>
            </div>
        @else
            <div class="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px]">
                <pre class="text-xs text-green-400 font-mono whitespace-pre-wrap">{{ $logContent }}</pre>
            </div>
        @endif
    </div>
</x-filament-panels::page>
