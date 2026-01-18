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
        $isVideo = str_contains(strtolower($requestedModel ?? ''), 'veo') || str_contains(strtolower($requestedModel ?? ''), 'kling');
        
        try {
            // Если есть токен Replicate - используем его (приоритет для видео Veo и Nano Banana)
            // Мы перешли полностью на Replicate
            $replicateModel = $isVideo ? 'kwaivgi/kling-v2.5-turbo-pro' : 'google/nano-banana';
            
            // User requested to use ONLY the admin key (API Key from settings)
            $token = $apiKey;
            
            return $this->initiateReplicateGeneration($token, $replicateModel, $input, $isVideo);

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
        // Если это фото, используем IDM-VTON (лучшая модель для примерки на Replicate)
        // Модель: cuuupid/idm-vton
        $params = [
            'prompt' => $input['prompt'],
        ];

        // Prepare images list
        $allImages = $input['imageUrls'];
        if (!empty($input['imagesBase64'])) {
            foreach($input['imagesBase64'] as $img) {
                $allImages[] = 'data:' . $img['mime_type'] . ';base64,' . $img['data'];
            }
        }

        if ($isVideo) {
            // Kling AI v2.5 Turbo Pro
            // Params: prompt, duration, aspect_ratio, input_image, negative_prompt
            // Model: kwaivgi/kling-v2.5-turbo-pro
            
            $params['duration'] = 5; 
            $params['aspect_ratio'] = '9:16';
            $params['negative_prompt'] = ""; 
            $params['cfg_scale'] = 0.9; // Increased for better prompt/image adherence
            $params['mode'] = 'pro'; // Explicitly request pro mode if applicable for this model variant

            // If an image is provided, Kling uses 'start_image'
            if (!empty($allImages)) {
                $params['start_image'] = $allImages[0];
            }
        } else {
            // Google Nano Banana
            // Params: prompt, image_input (array), aspect_ratio, output_format
            // Model: google/nano-banana

            $params['output_format'] = 'jpg';
            
            if (!empty($allImages)) {
                $params['image_input'] = $allImages;
                $params['aspect_ratio'] = 'match_input_image';
            } else {
                // Text to image fallback
                $params['aspect_ratio'] = '3:4'; 
            }
        }

        Log::info("Sending Replicate Prediction ($model)", ['params_keys' => array_keys($params)]);

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
