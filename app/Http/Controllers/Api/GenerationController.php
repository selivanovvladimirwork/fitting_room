<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiApiSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerationController extends Controller
{
    private const POLZA_API_BASE = 'https://api.polza.ai/api/v1';
    private const MAX_POLLING_ATTEMPTS = 60; // 60 * 2 сек = 2 мин макс
    private const POLLING_INTERVAL = 2; // секунды

    public function generate(Request $request)
    {
        Log::info('=== GENERATION REQUEST START ===');
        Log::info('Request data:', [
            'model' => $request->model ?? 'not set',
            'has_messages' => isset($request->messages),
            'messages_count' => count($request->messages ?? []),
        ]);

        $settings = AiApiSetting::getInstance();
        $apiKey = $settings->api_key;

        if (!$apiKey) {
            Log::error('API Key not configured');
            return response()->json(['error' => 'API Key not configured in backend'], 500);
        }

        Log::info('API Key found (first 10 chars):', ['key_prefix' => substr($apiKey, 0, 10) . '...']);

        try {
            // 1. Парсинг входных данных из формата OpenRouter/Gemini
            $images = [];
            $promptText = '';
            
            foreach ($request->messages ?? [] as $msgIndex => $msg) {
                Log::info("Parsing message {$msgIndex}:", ['role' => $msg['role'] ?? 'unknown']);
                
                foreach ($msg['content'] ?? [] as $partIndex => $part) {
                    $partType = $part['type'] ?? 'unknown';
                    Log::info("  Part {$partIndex}: type={$partType}");
                    
                    if ($partType === 'image_url' && isset($part['image_url']['url'])) {
                        $imageUrl = $part['image_url']['url'];
                        
                        // Проверяем, это Base64 или URL
                        if (str_starts_with($imageUrl, 'data:')) {
                            Log::info("    Found Base64 image (length: " . strlen($imageUrl) . ")");
                            // Извлекаем только base64 часть
                            $base64Data = preg_replace('/^data:image\/\w+;base64,/', '', $imageUrl);
                            $images[] = ['type' => 'base64', 'data' => $base64Data];
                        } else {
                            Log::info("    Found URL image: " . substr($imageUrl, 0, 100));
                            $images[] = ['type' => 'url', 'data' => $imageUrl];
                        }
                    }
                    
                    if ($partType === 'text' && isset($part['text'])) {
                        $promptText = $part['text'];
                        Log::info("    Found prompt text (length: " . strlen($promptText) . ")");
                    }
                }
            }

            Log::info('Parsed data summary:', [
                'images_count' => count($images),
                'prompt_length' => strlen($promptText),
                'prompt_preview' => substr($promptText, 0, 200) . '...',
            ]);

            // 2. Формируем запрос для Polza.ai
            $polzaPayload = [
                'model' => 'gemini-3-pro-image-preview',
                'prompt' => $promptText,
                'resolution' => '1K',
                'aspect_ratio' => '3:4', // Портретная ориентация для примерки
            ];

            // Разделяем URL и Base64 изображения
            $urlImages = array_filter($images, fn($img) => $img['type'] === 'url');
            $base64Images = array_filter($images, fn($img) => $img['type'] === 'base64');

            if (!empty($urlImages)) {
                $polzaPayload['filesUrl'] = array_map(fn($img) => $img['data'], array_values($urlImages));
            }
            if (!empty($base64Images)) {
                $polzaPayload['filesBase64'] = array_map(fn($img) => $img['data'], array_values($base64Images));
            }

            Log::info('Polza.ai request payload:', [
                'model' => $polzaPayload['model'],
                'resolution' => $polzaPayload['resolution'],
                'aspect_ratio' => $polzaPayload['aspect_ratio'],
                'filesUrl_count' => count($polzaPayload['filesUrl'] ?? []),
                'filesBase64_count' => count($polzaPayload['filesBase64'] ?? []),
            ]);

            // 3. Отправляем запрос на генерацию
            Log::info('Sending request to Polza.ai...');
            $startTime = microtime(true);

            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post(self::POLZA_API_BASE . '/images/generations', $polzaPayload);

            $requestDuration = round((microtime(true) - $startTime) * 1000);
            Log::info("Polza.ai initial response (took {$requestDuration}ms):", [
                'status' => $response->status(),
                'body' => substr($response->body(), 0, 500),
            ]);

            if (!$response->successful()) {
                Log::error('Polza.ai generation request failed:', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return response()->json([
                    'error' => 'Generation request failed: ' . $response->body()
                ], $response->status());
            }

            $requestId = $response->json('requestId');
            if (!$requestId) {
                Log::error('No requestId in response:', ['response' => $response->json()]);
                return response()->json(['error' => 'No requestId received'], 500);
            }

            Log::info("Got requestId: {$requestId}, starting polling...");

            // 4. Polling для получения результата
            for ($attempt = 1; $attempt <= self::MAX_POLLING_ATTEMPTS; $attempt++) {
                sleep(self::POLLING_INTERVAL);

                Log::info("Polling attempt {$attempt}/" . self::MAX_POLLING_ATTEMPTS);

                $statusResponse = Http::timeout(10)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $apiKey,
                    ])
                    ->get(self::POLZA_API_BASE . "/images/{$requestId}");

                $statusData = $statusResponse->json();
                $status = $statusData['status'] ?? 'unknown';

                Log::info("Status response:", [
                    'http_status' => $statusResponse->status(),
                    'generation_status' => $status,
                    'data_keys' => array_keys($statusData),
                ]);

                // Проверяем различные варианты завершения
                if ($status === 'completed' || $status === 'success' || $status === 'done') {
                    // Ищем URL результата в разных возможных полях
                    $resultUrl = $statusData['result_url'] 
                        ?? $statusData['resultUrl'] 
                        ?? $statusData['url'] 
                        ?? $statusData['image_url']
                        ?? $statusData['data']['url']
                        ?? null;

                    if (!$resultUrl && isset($statusData['images'][0])) {
                        $resultUrl = $statusData['images'][0]['url'] ?? $statusData['images'][0];
                    }

                    Log::info('=== GENERATION COMPLETED ===', [
                        'result_url' => $resultUrl ? substr($resultUrl, 0, 100) . '...' : 'NOT FOUND',
                        'total_attempts' => $attempt,
                        'total_time_sec' => $attempt * self::POLLING_INTERVAL,
                    ]);

                    if (!$resultUrl) {
                        Log::error('Result URL not found in response:', ['data' => $statusData]);
                        return response()->json(['error' => 'Result URL not found'], 500);
                    }

                    // Возвращаем в формате, совместимом с фронтендом
                    return response()->json([
                        'choices' => [[
                            'message' => [
                                'images' => [[
                                    'image_url' => ['url' => $resultUrl]
                                ]]
                            ]
                        ]]
                    ]);
                }

                if ($status === 'failed' || $status === 'error') {
                    $errorMsg = $statusData['error'] ?? $statusData['message'] ?? 'Unknown error';
                    Log::error('Generation failed:', ['error' => $errorMsg, 'data' => $statusData]);
                    return response()->json(['error' => 'Generation failed: ' . $errorMsg], 500);
                }

                // Продолжаем polling для статусов: pending, processing, in_progress и т.д.
            }

            Log::error('Generation timeout after ' . self::MAX_POLLING_ATTEMPTS . ' attempts');
            return response()->json(['error' => 'Generation timeout'], 504);

        } catch (\Exception $e) {
            Log::error('Generation Exception:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => substr($e->getTraceAsString(), 0, 1000),
            ]);
            return response()->json(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Генерация видео через Veo 3.1 API
     * Поддерживает image-to-video для анимации примерки
     */
    public function generateVideo(Request $request)
    {
        Log::info('=== VIDEO GENERATION REQUEST START ===');
        Log::info('Request data:', [
            'prompt' => substr($request->prompt ?? '', 0, 200),
            'has_image' => isset($request->image_url) || isset($request->image_base64),
            'generation_type' => $request->generation_type ?? 'not set',
        ]);

        $settings = AiApiSetting::getInstance();
        $apiKey = $settings->api_key;

        if (!$apiKey) {
            Log::error('API Key not configured for video generation');
            return response()->json(['error' => 'API Key not configured in backend'], 500);
        }

        Log::info('API Key found for video (first 10 chars):', ['key_prefix' => substr($apiKey, 0, 10) . '...']);

        try {
            // Формируем запрос для Veo 3.1
            $veoPayload = [
                'model' => $request->model ?? 'veo3.1',
                'prompt' => $request->prompt ?? 'Animate this image with natural movement',
                'aspectRatio' => '9:16', // Вертикальный формат для сторис
            ];

            // Определяем тип генерации
            if ($request->image_url || $request->image_base64) {
                // Image-to-Video режим
                $veoPayload['generationType'] = 'REFERENCE_2_VIDEO';
                
                if ($request->image_url) {
                    $veoPayload['imageUrls'] = [$request->image_url];
                    Log::info('Using image URL for video:', ['url' => substr($request->image_url, 0, 100)]);
                }
                
                if ($request->image_base64) {
                    $veoPayload['startImage'] = $request->image_base64;
                    Log::info('Using base64 image for video (length: ' . strlen($request->image_base64) . ')');
                }
            } else {
                // Text-to-Video режим
                $veoPayload['generationType'] = 'TEXT_2_VIDEO';
                Log::info('Using text-to-video mode');
            }

            Log::info('Veo 3.1 request payload:', [
                'model' => $veoPayload['model'],
                'aspectRatio' => $veoPayload['aspectRatio'],
                'generationType' => $veoPayload['generationType'],
                'prompt_length' => strlen($veoPayload['prompt']),
            ]);

            // Отправляем запрос на генерацию
            Log::info('Sending video request to Polza.ai...');
            $startTime = microtime(true);

            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post(self::POLZA_API_BASE . '/videos/generations', $veoPayload);

            $requestDuration = round((microtime(true) - $startTime) * 1000);
            Log::info("Polza.ai video initial response (took {$requestDuration}ms):", [
                'status' => $response->status(),
                'body' => substr($response->body(), 0, 500),
            ]);

            if (!$response->successful()) {
                Log::error('Polza.ai video generation request failed:', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return response()->json([
                    'error' => 'Video generation request failed: ' . $response->body()
                ], $response->status());
            }

            $requestId = $response->json('requestId');
            if (!$requestId) {
                Log::error('No requestId in video response:', ['response' => $response->json()]);
                return response()->json(['error' => 'No requestId received for video'], 500);
            }

            Log::info("Got video requestId: {$requestId}, starting polling...");

            // Polling для получения результата (видео генерируется дольше)
            $maxVideoAttempts = 120; // 120 * 3 сек = 6 мин макс для видео
            $videoPollingInterval = 3;

            for ($attempt = 1; $attempt <= $maxVideoAttempts; $attempt++) {
                sleep($videoPollingInterval);

                Log::info("Video polling attempt {$attempt}/{$maxVideoAttempts}");

                $statusResponse = Http::timeout(10)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $apiKey,
                    ])
                    ->get(self::POLZA_API_BASE . "/videos/{$requestId}");

                $statusData = $statusResponse->json();
                $status = $statusData['status'] ?? 'unknown';

                Log::info("Video status response:", [
                    'http_status' => $statusResponse->status(),
                    'generation_status' => $status,
                    'data_keys' => array_keys($statusData),
                ]);

                // Проверяем завершение
                if ($status === 'completed' || $status === 'success' || $status === 'done') {
                    // Ищем URL видео
                    $videoUrl = $statusData['video_url'] 
                        ?? $statusData['videoUrl'] 
                        ?? $statusData['url'] 
                        ?? $statusData['result_url']
                        ?? $statusData['data']['url']
                        ?? null;

                    if (!$videoUrl && isset($statusData['videos'][0])) {
                        $videoUrl = $statusData['videos'][0]['url'] ?? $statusData['videos'][0];
                    }

                    Log::info('=== VIDEO GENERATION COMPLETED ===', [
                        'video_url' => $videoUrl ? substr($videoUrl, 0, 100) . '...' : 'NOT FOUND',
                        'total_attempts' => $attempt,
                        'total_time_sec' => $attempt * $videoPollingInterval,
                    ]);

                    if (!$videoUrl) {
                        Log::error('Video URL not found in response:', ['data' => $statusData]);
                        return response()->json(['error' => 'Video URL not found'], 500);
                    }

                    return response()->json([
                        'success' => true,
                        'video_url' => $videoUrl,
                        'request_id' => $requestId,
                    ]);
                }

                if ($status === 'failed' || $status === 'error') {
                    $errorMsg = $statusData['error'] ?? $statusData['message'] ?? 'Unknown error';
                    Log::error('Video generation failed:', ['error' => $errorMsg, 'data' => $statusData]);
                    return response()->json(['error' => 'Video generation failed: ' . $errorMsg], 500);
                }

                // Продолжаем polling
            }

            Log::error('Video generation timeout after ' . $maxVideoAttempts . ' attempts');
            return response()->json(['error' => 'Video generation timeout'], 504);

        } catch (\Exception $e) {
            Log::error('Video Generation Exception:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => substr($e->getTraceAsString(), 0, 1000),
            ]);
            return response()->json(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
        }
    }
}
