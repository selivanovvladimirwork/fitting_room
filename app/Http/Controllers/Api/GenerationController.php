<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiApiSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GenerationController extends Controller
{

    // Cloudflare Worker прокси для обхода географических ограничений
    private const GEMINI_API_BASE = 'https://curly-butterfly-5085.fixersagency.workers.dev/v1beta';
    private const REPLICATE_API_BASE = 'https://api.replicate.com/v1';

    /**
     * Инициирует генерацию и возвращает результат или requestId для polling.
     */
    public function generate(Request $request)
    {
        Log::info('=== GENERATION REQUEST START ===');
        
        $settings = AiApiSetting::getInstance();
        $apiKey = $settings->api_key;
        $replicateToken = env('REPLICATE_API_TOKEN'); // Проверяем токен Replicate

        if (!$apiKey && !$replicateToken) {
            Log::error('API Keys not configured');
            return response()->json(['error' => 'API Keys not configured in backend'], 500);
        }

        $input = $this->parseOpenRouterMessage($request->messages);
        
        $requestedModel = $request->model;
        $isVideo = str_contains(strtolower($requestedModel ?? ''), 'veo');
        
        try {
            // Если есть токен Replicate - используем его (приоритет для видео Veo и Nano Banana)
            // Мы перешли полностью на Replicate
            $replicateModel = $isVideo ? 'google/veo-3' : 'google/nano-banana';
            
            return $this->initiateReplicateGeneration($apiKey, $replicateModel, $input, $isVideo);

        } catch (\Exception $e) {
            Log::error('Generation Exception', [
                'message' => $e->getMessage(),
                'trace' => substr($e->getTraceAsString(), 0, 500)
            ]);
            return response()->json(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Проверяет статус генерации video/image (Replicate).
     */
    public function status(Request $request, string $requestId)
    {
        $settings = AiApiSetting::getInstance();
        $apiKey = $settings->api_key;

        if (!$apiKey) {
            return response()->json(['error' => 'API Token not configured'], 500);
        }

        return $this->checkReplicateStatus($apiKey, $requestId);
    }

    /**
     * Генерация через Replicate (Generic for Video & Image)
     */
    private function initiateReplicateGeneration($token, $model, $input, $isVideo)
    {
        // Подготовка входных параметров для Replicate
        // Подготовка параметров для Replicate
        $params = [
            'prompt' => $input['prompt'],
            'output_format' => $isVideo ? 'mp4' : 'jpg'
        ];
        
        if ($isVideo) {
             $params['video_duration'] = '5s'; 
             $params['aspect_ratio'] = '9:16';
        } else {
             $params['aspect_ratio'] = '3:4';
             $params['safety_filter_level'] = 'block_only_high_harmability';
        }
        
        // Обработка изображений для мультимодального ввода
        // 1. Собираем все ссылки
        $allImages = $input['imageUrls'];
        if (!empty($input['imagesBase64'])) {
            // Replicate лучше работает с URL или dataURI
            foreach($input['imagesBase64'] as $img) {
                $allImages[] = 'data:' . $img['mime_type'] . ';base64,' . $img['data'];
            }
        }

        if (!empty($allImages)) {
            // Стратегия 1: Для известных мультимодальных моделей пробуем передать массив
            // Но большинство API принимают только 'image'.
            // Берем ПЕРВУЮ картинку как основную (image)
            $params['image'] = $allImages[0];
            
            // Стратегия 2: Если картинок > 1, пытаемся передать их как additional_images или в промпт
            if (count($allImages) > 1) {
                 // Добавляем ссылки в промпт (Gemini часто умеет читать ссылки из текста)
                 // или если это кастомная модель.
                 // Для Nano-banana (Gemini) это может не сработать, если она не ходит в интернет.
                 // Но попробовать стоит.
            }
            
            // EXPERIMENTAL: Для Replicate Gemini часто используется параметр 'images' (array) вместо 'image' (string)
            // Но если мы используем image-to-video (Veo), там строго 'image'.
            if (!$isVideo) {
                // Для фото пробуем передать ВСЕ картинки если параметр поддерживается (игнорируется если нет)
                // $params['input_images'] = $allImages; 
            }
        }

        // ВАЖНО: Если это задача примерки (Virtual Try-On), то нам нужны ВСЕ картинки.
        // Так как мы не знаем точную спецификацию "google/nano-banana", 
        // мы добавим описание к промпту, что есть несколько изображений.
        // И попытаемся передать вторую картинку (одежду) как 'mask' или 'condition_image' на удачу? Нет.
        
        // Давайте просто добавим ссылки в промпт, это самый безопасный способ для LLM Vision
        $imageLinksText = "\n\nReferenced Images:\n";
        foreach ($allImages as $idx => $url) {
            if (str_starts_with($url, 'data:')) continue; // Data URI слишком длинные для промпта
            $imageLinksText .= "Image " . ($idx + 1) . ": " . $url . "\n";
        }
        
        if (count($allImages) > 0) {
            $params['prompt'] .= $imageLinksText;
        }

        Log::info("Sending Replicate Prediction ($model)", ['params' => array_keys($params)]);

        $response = Http::withToken($token)
            ->post(self::REPLICATE_API_BASE . "/models/{$model}/predictions", [
                'input' => $params
            ]);

        if (!$response->successful()) {
            Log::error('Replicate API Error', ['status' => $response->status(), 'body' => $response->body()]);
            return response()->json(['error' => 'Replicate Provider error: ' . $response->body()], $response->status());
        }

        $data = $response->json();
        $requestId = $data['id'];

        Log::info("Replicate started. ID: {$requestId}");

        // Возвращаем статус initiated для всего (async)
        // Frontend будет поллить и images, и videos.
        return response()->json([
            'status' => 'initiated',
            'requestId' => $requestId,
            'type' => $isVideo ? 'videos' : 'images', 
            'message' => 'Generation started via Replicate.'
        ]);
    }

    private function checkReplicateStatus($token, $requestId)
    {
        $response = Http::withToken($token)->get(self::REPLICATE_API_BASE . "/predictions/{$requestId}");
        
        if (!$response->successful()) {
            return response()->json(['error' => 'Replicate status check failed'], 500);
        }

        $data = $response->json();
        $status = $data['status']; // starting, processing, succeeded, failed, canceled

        if ($status === 'succeeded') {
            $output = $data['output']; 
            // Output бывает array или string
            $resultUrl = is_array($output) ? $output[0] : $output;
            
            Log::info("Replicate completed: $resultUrl");

            // Сохраняем локально, так как ссылки Replicate временные? (обычно 1 час - сутки)
            // Лучше сохранить.
             try {
                $ext = str_contains($resultUrl, '.mp4') ? 'mp4' : 'jpg';
                $savedUrl = $this->saveUrlToStorage($resultUrl, $ext);
                $resultUrl = $savedUrl;
             } catch (\Exception $e) {
                Log::warning("Failed to save Replicate output locally, using remote URL", ['error' => $e->getMessage()]);
             }

            return response()->json([
                'status' => 'completed',
                'result_url' => $resultUrl,
                'choices' => [[
                    'message' => [
                        'content' => null,
                        'images' => [['image_url' => ['url' => $resultUrl]]]
                    ]
                ]]
            ]);
        } elseif ($status === 'failed' || $status === 'canceled') {
            return response()->json(['status' => 'failed', 'error' => $data['error'] ?? 'Generation failed'], 500);
        }

        return response()->json(['status' => 'processing']);
    }

    /**
     * Сохраняет файл по URL (утилита)
     */
    private function saveUrlToStorage($url, $extension)
    {
        $response = Http::timeout(60)->get($url);
        if (!$response->successful()) throw new \Exception("Download failed");
        
        $filename = 'rep_' . Str::random(12) . '.' . $extension;
        $path = 'generations/' . $filename;
        Storage::disk('public')->put($path, $response->body());
        return url('storage/' . $path);
    }

    /**
     * Парсит сообщения (вспомогательный метод без изменений логики)
     */
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
                    
                    if (str_starts_with($url, 'data:')) {
                         if (preg_match('/^data:(image\/[a-z]+);base64,(.+)$/', $url, $matches)) {
                            $imagesBase64[] = ['mime_type' => $matches[1], 'data' => $matches[2]];
                        }
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
}
