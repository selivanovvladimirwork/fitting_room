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
    private const MAX_POLLING_ATTEMPTS = 60; // 2 минуты макс
    private const POLLING_INTERVAL = 2; // сек

    public function generate(Request $request)
    {
        Log::info('=== POLZA.AI GENERATION REQUEST START ===');
        
        $settings = AiApiSetting::getInstance();
        $apiKey = $settings->api_key;

        if (!$apiKey) {
            Log::error('API Key not configured');
            return response()->json(['error' => 'API Key not configured in backend'], 500);
        }

        // 1. Извлечение данных из OpenRouter-формата
        $input = $this->parseOpenRouterMessage($request->messages);
        
        // Определяем, видео это или фото, по модели или наличию 'veo'
        $requestedModel = $request->model;
        $isVideo = str_contains(strtolower($requestedModel), 'veo') || str_contains(strtolower($input['prompt']), 'video');
        
        Log::info('Request type detection:', [
            'requested_model' => $requestedModel,
            'is_video' => $isVideo,
            'prompt_preview' => substr($input['prompt'], 0, 50) . '...'
        ]);

        try {
            if ($isVideo) {
                return $this->generateVideo($apiKey, $input);
            } else {
                return $this->generateImage($apiKey, $input);
            }
        } catch (\Exception $e) {
            Log::error('Generation Exception', [
                'message' => $e->getMessage(),
                'trace' => substr($e->getTraceAsString(), 0, 500)
            ]);
            return response()->json(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
        }
    }

    private function parseOpenRouterMessage($messages)
    {
        $images = [];
        $promptText = '';
        
        foreach ($messages ?? [] as $msg) {
            foreach ($msg['content'] ?? [] as $part) {
                if (($part['type'] ?? '') === 'image_url') {
                    $url = $part['image_url']['url'] ?? '';
                    if ($url) $images[] = $url;
                }
                if (($part['type'] ?? '') === 'text') {
                    $promptText .= ($part['text'] ?? '') . ' ';
                }
            }
        }

        return [
            'images' => $images,
            'prompt' => trim($promptText)
        ];
    }

    private function generateImage($apiKey, $input)
    {
        $payload = [
            'model' => 'nano-banana',
            'prompt' => $input['prompt'],
            'size' => '3:4', // Default for vertical fitting room
            'output_format' => 'png'
        ];

        if (!empty($input['images'])) {
            $payload['filesUrl'] = $input['images'];
        }

        Log::info('Sending Image Request to Polza:', $payload);

        $response = Http::withHeaders(['Authorization' => 'Bearer ' . $apiKey])
            ->post(self::POLZA_API_BASE . '/images/generations', $payload);

        if (!$response->successful()) {
            return $this->handleApiError($response);
        }

        $requestId = $response->json('requestId');
        return $this->pollStatus($apiKey, 'images', $requestId);
    }

    private function generateVideo($apiKey, $input)
    {
        // Для анимации нам нужно Image-to-Video
        $payload = [
            'model' => 'veo3.1-fast',
            'prompt' => $input['prompt'],
            'aspectRatio' => '3:4', // Внимание: aspectRatio (camelCase) для видео
            'generationType' => !empty($input['images']) ? 'FIRST_AND_LAST_FRAMES_2_VIDEO' : 'TEXT_2_VIDEO'
        ];

        if (!empty($input['images'])) {
            // Передаем и как startImage (главный референс), и в imageUrls (контекст)
            $payload['startImage'] = $input['images'][0];
            $payload['imageUrls'] = $input['images']; 
        }

        Log::info('Sending Video Request to Polza:', $payload);

        $response = Http::withHeaders(['Authorization' => 'Bearer ' . $apiKey])
            ->post(self::POLZA_API_BASE . '/videos/generations', $payload);

        if (!$response->successful()) {
            return $this->handleApiError($response);
        }

        $requestId = $response->json('requestId');
        return $this->pollStatus($apiKey, 'videos', $requestId);
    }

    private function pollStatus($apiKey, $type, $requestId)
    {
        Log::info("Polling {$type} status for ID: {$requestId}");

        for ($i = 0; $i < self::MAX_POLLING_ATTEMPTS; $i++) {
            sleep(self::POLLING_INTERVAL);

            $response = Http::withHeaders(['Authorization' => 'Bearer ' . $apiKey])
                ->get(self::POLZA_API_BASE . "/{$type}/{$requestId}");
            
            $data = $response->json();
            $status = $data['status'] ?? 'unknown';

            if ($status === 'COMPLETED' || $status === 'completed' || $status === 'success') {
                $resultUrl = $data['url'] ?? $data['result_url'] ?? $data['resultUrl'] ?? ($data['images'][0]['url'] ?? null);
                
                Log::info("Generation completed. URL: " . substr($resultUrl ?? 'null', 0, 50));
                
                // Возвращаем в формате OpenRouter для совместимости с фронтом
                return response()->json([
                    'choices' => [[
                        'message' => [
                            'content' => null,
                            'images' => $resultUrl ? [['image_url' => ['url' => $resultUrl]]] : [],
                            // Для видео можно передать url в контенте или спец поле, 
                            // но фронт ждет images[0].image_url для отображения результата
                        ]
                    ]]
                ]);
            }

            if ($status === 'FAILED' || $status === 'failed' || $status === 'error') {
                Log::error("Generation failed", ['data' => $data]);
                return response()->json(['error' => 'Generation failed: ' . ($data['error'] ?? 'Unknown')], 500);
            }
        }

        return response()->json(['error' => 'Generation timeout'], 504);
    }

    private function handleApiError($response)
    {
        Log::error('Polza API Error', ['body' => $response->body()]);
        return response()->json(['error' => 'Provider error: ' . $response->body()], $response->status());
    }
}
