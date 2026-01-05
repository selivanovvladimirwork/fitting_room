<x-filament-panels::page>
    <div class="space-y-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 class="text-xl font-bold mb-4 dark:text-white">API Endpoints</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-4">База URL: <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{{ url('/api') }}</code></p>
        </div>
        
        @foreach($endpoints as $endpoint)
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                <div class="flex items-center gap-3 p-4 border-b dark:border-gray-700">
                    <span class="px-3 py-1 rounded text-sm font-bold
                        @if($endpoint['method'] === 'GET') bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200
                        @elseif($endpoint['method'] === 'POST') bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200
                        @elseif($endpoint['method'] === 'PUT') bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200
                        @elseif($endpoint['method'] === 'DELETE') bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200
                        @endif">
                        {{ $endpoint['method'] }}
                    </span>
                    <code class="text-gray-800 dark:text-gray-200 font-mono">{{ $endpoint['path'] }}</code>
                </div>
                
                <div class="p-4 space-y-3">
                    <p class="text-gray-600 dark:text-gray-400">{{ $endpoint['description'] }}</p>
                    
                    @if(!empty($endpoint['params']))
                        <div>
                            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Параметры:</h4>
                            <div class="bg-gray-50 dark:bg-gray-900 rounded p-3">
                                @foreach($endpoint['params'] as $param => $desc)
                                    <div class="flex gap-2 text-sm">
                                        <code class="text-purple-600 dark:text-purple-400">{{ $param }}</code>
                                        <span class="text-gray-500">-</span>
                                        <span class="text-gray-600 dark:text-gray-400">{{ $desc }}</span>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endif
                    
                    <div>
                        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Пример ответа:</h4>
                        <pre class="bg-gray-900 text-green-400 rounded p-3 text-xs overflow-x-auto"><code>{{ $endpoint['response'] }}</code></pre>
                    </div>
                </div>
            </div>
        @endforeach
    </div>
</x-filament-panels::page>
