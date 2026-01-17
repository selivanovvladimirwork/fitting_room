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

    /**
     * Инициирует генерацию и сразу возвращает requestId.
     * Клиент должен сам опрашивать статус через /api/generate/status/{id}
     */
    public function generate(Request $request)
    {
        Log::info('=== POLZA.AI GENERATION REQUEST START ===');
        
        $settings = AiApiSetting::getInstance();
        $apiKey = $settings->api_key;

        if (!$apiKey) {
            Log::error('API Key not configured');
            return response()->json(['error' => 'API Key not configured in backend'], 500);
        }

        $input = $this->parseOpenRouterMessage($request->messages);
        
        $requestedModel = $request->model;
        $isVideo = str_contains(strtolower($requestedModel ?? ''), 'veo');
        
        Log::info('Request type detection:', [
            'requested_model' => $requestedModel,
            'is_video' => $isVideo,
            'images_count' => count($input['images']),
            'prompt_preview' => substr($input['prompt'], 0, 100) . '...'
        ]);

        try {
            if ($isVideo) {
                return $this->initiateVideo($apiKey, $input);
            } else {
                return $this->initiateImage($apiKey, $input);
            }
        } catch (\Exception $e) {
            Log::error('Generation Exception', [
                'message' => $e->getMessage(),
                'trace' => substr($e->getTraceAsString(), 0, 500)
            ]);
            return response()->json(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Проверяет статус генерации по requestId.
     * Вызывается клиентом для polling.
     */
    public function status(Request $request, string $requestId)
    {
        $settings = AiApiSetting::getInstance();
        $apiKey = $settings->api_key;

        if (!$apiKey) {
            return response()->json(['error' => 'API Key not configured'], 500);
        }

        // Определяем тип по параметру запроса (по умолчанию images)
        $type = $request->query('type', 'images');

        Log::info("Checking status for {$type}/{$requestId}");

        try {
            $response = Http::withHeaders(['Authorization' => 'Bearer ' . $apiKey])
                ->get(self::POLZA_API_BASE . "/{$type}/{$requestId}");

            $data = $response->json();
            $status = strtoupper(trim($data['status'] ?? 'UNKNOWN'));

            Log::info("Status response:", [
                'status' => $status,
                'has_url' => isset($data['url']),
                'data_keys' => array_keys($data)
            ]);

            if ($status === 'COMPLETED' || $status === 'SUCCESS') {
                $resultUrl = $data['url'] ?? $data['result_url'] ?? $data['resultUrl'] ?? null;
                
                if (!$resultUrl && isset($data['images'][0])) {
                    $resultUrl = is_string($data['images'][0]) ? $data['images'][0] : ($data['images'][0]['url'] ?? null);
                }

                Log::info("Generation completed. URL: " . ($resultUrl ? substr($resultUrl, 0, 80) : 'null'));

                return response()->json([
                    'status' => 'completed',
                    'result_url' => $resultUrl,
                    // Для совместимости с текущим фронтом
                    'choices' => [[
                        'message' => [
                            'content' => null,
                            'images' => $resultUrl ? [['image_url' => ['url' => $resultUrl]]] : []
                        ]
                    ]]
                ]);
            }

            if ($status === 'FAILED' || $status === 'ERROR') {
                Log::error("Generation failed", ['data' => $data]);
                return response()->json([
                    'status' => 'failed',
                    'error' => $data['error'] ?? 'Unknown error'
                ], 500);
            }

            // Всё ещё в процессе
            return response()->json([
                'status' => 'processing',
                'message' => 'Generation in progress...'
            ]);

        } catch (\Exception $e) {
            Log::error('Status check Exception', ['message' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function parseOpenRouterMessage($messages)
    {
        $imageUrls = [];
        $imagesBase64 = [];
        $promptText = '';
        
        foreach ($messages ?? [] as $msg) {
            foreach ($msg['content'] ?? [] as $part) {
                if (($part['type'] ?? '') === 'image_url') {
                    $url = $part['image_url']['url'] ?? '';
                    if (!$url) continue;
                    
                    // Разделяем Base64 и URL
                    if (str_starts_with($url, 'data:')) {
                        // Извлекаем только base64 часть без префикса
                        $base64Data = preg_replace('/^data:image\/[a-z]+;base64,/', '', $url);
                        $imagesBase64[] = $base64Data;
                    } else {
                        $imageUrls[] = $url;
                    }
                }
                if (($part['type'] ?? '') === 'text') {
                    $promptText .= ($part['text'] ?? '') . ' ';
                }
            }
        }

        return [
            'imageUrls' => $imageUrls,
            'imagesBase64' => $imagesBase64,
            'prompt' => trim($promptText)
        ];
    }

    private function initiateImage($apiKey, $input)
    {
        $payload = [
            'model' => 'nano-banana',
            'prompt' => $input['prompt'],
            'size' => '3:4',
            'output_format' => 'png'
        ];

        // URL изображения
        if (!empty($input['imageUrls'])) {
            $payload['filesUrl'] = $input['imageUrls'];
        }
        // Base64 изображения
        if (!empty($input['imagesBase64'])) {
            $payload['filesBase64'] = $input['imagesBase64'];
        }

        Log::info('Sending Image Request to Polza:', $payload);

        $response = Http::withHeaders(['Authorization' => 'Bearer ' . $apiKey])
            ->post(self::POLZA_API_BASE . '/images/generations', $payload);

        if (!$response->successful()) {
            Log::error('Polza API Error', ['body' => $response->body()]);
            return response()->json(['error' => 'Provider error: ' . $response->body()], $response->status());
        }

        $requestId = $response->json('requestId');
        Log::info("Image generation initiated. RequestId: {$requestId}");

        return response()->json([
            'status' => 'initiated',
            'requestId' => $requestId,
            'type' => 'images',
            'message' => 'Generation started. Poll /api/generate/status/{requestId}?type=images for updates.'
        ]);
    }

    private function initiateVideo($apiKey, $input)
    {
        $hasImages = !empty($input['imageUrls']) || !empty($input['imagesBase64']);
        
        $payload = [
            'model' => 'veo3.1-fast',
            'prompt' => $input['prompt'],
            'aspectRatio' => '3:4',
            'generationType' => $hasImages ? 'FIRST_AND_LAST_FRAMES_2_VIDEO' : 'TEXT_2_VIDEO'
        ];

        // Для видео используем первое изображение как startImage
        if (!empty($input['imageUrls'])) {
            $payload['startImage'] = $input['imageUrls'][0];
            $payload['imageUrls'] = $input['imageUrls'];
        } elseif (!empty($input['imagesBase64'])) {
            // Для Base64 используем startImageBase64 (если поддерживается)
            $payload['startImageBase64'] = $input['imagesBase64'][0];
        }

        Log::info('Sending Video Request to Polza:', $payload);

        $response = Http::withHeaders(['Authorization' => 'Bearer ' . $apiKey])
            ->post(self::POLZA_API_BASE . '/videos/generations', $payload);

        if (!$response->successful()) {
            Log::error('Polza API Error', ['body' => $response->body()]);
            return response()->json(['error' => 'Provider error: ' . $response->body()], $response->status());
        }

        $requestId = $response->json('requestId');
        Log::info("Video generation initiated. RequestId: {$requestId}");

        return response()->json([
            'status' => 'initiated',
            'requestId' => $requestId,
            'type' => 'videos',
            'message' => 'Generation started. Poll /api/generate/status/{requestId}?type=videos for updates.'
        ]);
    }
}
