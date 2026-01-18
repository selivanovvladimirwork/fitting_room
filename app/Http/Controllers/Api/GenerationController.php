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

    /**
     * Инициирует генерацию и возвращает результат или requestId для polling.
     */
    public function generate(Request $request)
    {
        Log::info('=== GEMINI API GENERATION REQUEST START ===');
        
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
            'imageUrls_count' => count($input['imageUrls'] ?? []),
            'imagesBase64_count' => count($input['imagesBase64'] ?? []),
            'prompt_preview' => substr($input['prompt'], 0, 100) . '...'
        ]);

        try {
            if ($isVideo) {
                return $this->initiateVideo($apiKey, $input);
            } else {
                return $this->generateImageSync($apiKey, $input);
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
     * Проверяет статус генерации видео по operationName.
     */
    public function status(Request $request, string $requestId)
    {
        $settings = AiApiSetting::getInstance();
        $apiKey = $settings->api_key;

        if (!$apiKey) {
            return response()->json(['error' => 'API Key not configured'], 500);
        }

        $type = $request->query('type', 'images');

        // Для изображений статуса нет — они синхронные
        if ($type === 'images') {
            return response()->json(['error' => 'Images are generated synchronously'], 400);
        }

        Log::info("Checking Veo video status for operation: {$requestId}");

        try {
            // Decode operation name (was base64 encoded for URL safety)
            $operationName = base64_decode($requestId);
            
            $response = Http::get(self::GEMINI_API_BASE . "/{$operationName}", [
                'key' => $apiKey
            ]);

            $data = $response->json();
            
            Log::info("Veo status response:", [
                'done' => $data['done'] ?? false,
                'has_response' => isset($data['response']),
                'has_error' => isset($data['error'])
            ]);

            if (isset($data['error'])) {
                Log::error("Veo generation failed", ['error' => $data['error']]);
                return response()->json([
                    'status' => 'failed',
                    'error' => $data['error']['message'] ?? 'Video generation failed'
                ], 500);
            }

            if ($data['done'] ?? false) {
                // Видео готово — скачиваем и сохраняем
                $generatedVideos = $data['response']['generatedVideos'] ?? [];
                
                if (empty($generatedVideos)) {
                    return response()->json([
                        'status' => 'failed',
                        'error' => 'No videos generated'
                    ], 500);
                }

                $video = $generatedVideos[0];
                $videoFile = $video['video'] ?? null;
                
                if (!$videoFile) {
                    return response()->json([
                        'status' => 'failed',
                        'error' => 'Video file not found in response'
                    ], 500);
                }

                // Скачиваем видео через Files API
                $resultUrl = $this->downloadAndSaveVideo($apiKey, $videoFile);
                
                Log::info("Video generation completed. URL: " . $resultUrl);

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
            }

            // Всё ещё в процессе
            return response()->json([
                'status' => 'processing',
                'message' => 'Video generation in progress...'
            ]);

        } catch (\Exception $e) {
            Log::error('Status check Exception', ['message' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Парсит сообщения в формате OpenRouter.
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
                        // Извлекаем base64 и mime type
                        if (preg_match('/^data:(image\/[a-z]+);base64,(.+)$/', $url, $matches)) {
                            $imagesBase64[] = [
                                'mime_type' => $matches[1],
                                'data' => $matches[2]
                            ];
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

    /**
     * Генерация изображения через Gemini (синхронно).
     */
    private function generateImageSync($apiKey, $input)
    {
        $contents = [];
        $parts = [];

        // Добавляем все изображения
        foreach ($input['imagesBase64'] as $img) {
            $parts[] = [
                'inline_data' => [
                    'mime_type' => $img['mime_type'],
                    'data' => $img['data']
                ]
            ];
        }

        // Конвертируем URL в base64
        foreach ($input['imageUrls'] as $url) {
            try {
                $imageData = $this->fetchImageAsBase64($url);
                if ($imageData) {
                    $parts[] = [
                        'inline_data' => [
                            'mime_type' => $imageData['mime_type'],
                            'data' => $imageData['data']
                        ]
                    ];
                }
            } catch (\Exception $e) {
                Log::warning("Failed to fetch image from URL: {$url}", ['error' => $e->getMessage()]);
            }
        }

        // Добавляем промпт
        $parts[] = ['text' => $input['prompt']];

        $contents[] = ['role' => 'user', 'parts' => $parts];

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'responseModalities' => ['TEXT', 'IMAGE'],
                'imageConfig' => [
                    'aspectRatio' => '3:4',
                    'imageSize' => '2K'
                ]
            ],
            'safetySettings' => [
                ['category' => 'HARM_CATEGORY_HARASSMENT', 'threshold' => 'BLOCK_NONE'],
                ['category' => 'HARM_CATEGORY_HATE_SPEECH', 'threshold' => 'BLOCK_NONE'],
                ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_NONE'],
                ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_NONE'],
            ]
        ];

        Log::info('Sending Image Request to Gemini:', [
            'model' => 'gemini-3-pro-image-preview',
            'parts_count' => count($parts),
            'prompt_preview' => substr($input['prompt'], 0, 100)
        ]);

        $response = Http::timeout(120)
            ->post(self::GEMINI_API_BASE . '/models/gemini-3-pro-image-preview:generateContent?key=' . $apiKey, $payload);

        if (!$response->successful()) {
            Log::error('Gemini API Error', ['status' => $response->status(), 'body' => $response->body()]);
            return response()->json(['error' => 'Provider error: ' . $response->body()], $response->status());
        }

        $data = $response->json();
        
        // Ищем изображение в ответе
        $candidates = $data['candidates'] ?? [];
        if (empty($candidates)) {
            Log::error('No candidates in Gemini response');
            return response()->json(['error' => 'No image generated'], 500);
        }

        $responseParts = $candidates[0]['content']['parts'] ?? [];
        $generatedImageData = null;
        $responseText = null;

        foreach ($responseParts as $part) {
            if (isset($part['inlineData'])) {
                $generatedImageData = $part['inlineData'];
            } elseif (isset($part['inline_data'])) {
                $generatedImageData = $part['inline_data'];
            } elseif (isset($part['text'])) {
                $responseText = $part['text'];
            }
        }

        if (!$generatedImageData) {
            Log::error('No image in Gemini response', ['parts' => $responseParts]);
            return response()->json([
                'error' => 'No image generated. Model response: ' . ($responseText ?? 'empty'),
                'text' => $responseText
            ], 500);
        }

        // Сохраняем изображение
        $resultUrl = $this->saveBase64Image($generatedImageData);
        
        Log::info("Image generation completed. URL: {$resultUrl}");

        // Возвращаем сразу completed (синхронная генерация)
        return response()->json([
            'status' => 'completed',
            'result_url' => $resultUrl,
            'choices' => [[
                'message' => [
                    'content' => $responseText,
                    'images' => [['image_url' => ['url' => $resultUrl]]]
                ]
            ]]
        ]);
    }

    /**
     * Инициация генерации видео через Veo 3.0.
     * Veo API использует формат instances/parameters для predictLongRunning
     */
    private function initiateVideo($apiKey, $input)
    {
        // Формируем instance для Veo predictLongRunning
        $instance = [
            'prompt' => $input['prompt']
        ];

        // Добавляем стартовое изображение если есть
        if (!empty($input['imagesBase64'])) {
            $img = $input['imagesBase64'][0];
            $instance['image'] = [
                'bytesBase64Encoded' => $img['data']
            ];
        } elseif (!empty($input['imageUrls'])) {
            try {
                $imageData = $this->fetchImageAsBase64($input['imageUrls'][0]);
                if ($imageData) {
                    $instance['image'] = [
                        'bytesBase64Encoded' => $imageData['data']
                    ];
                }
            } catch (\Exception $e) {
                Log::warning("Failed to fetch start image for video", ['error' => $e->getMessage()]);
            }
        }

        $payload = [
            'instances' => [$instance],
            'parameters' => [
                'aspectRatio' => '9:16',
                'sampleCount' => 1
            ]
        ];

        Log::info('Sending Video Request to Gemini Veo:', [
            'model' => 'veo-3.0-generate',
            'has_image' => isset($instance['image']),
            'prompt_preview' => substr($input['prompt'], 0, 100)
        ]);

        $response = Http::timeout(120)
            ->post(self::GEMINI_API_BASE . '/models/veo-3.0-generate:predictLongRunning?key=' . $apiKey, $payload);

        if (!$response->successful()) {
            Log::error('Gemini Veo API Error', ['status' => $response->status(), 'body' => $response->body()]);
            return response()->json(['error' => 'Provider error: ' . $response->body()], $response->status());
        }

        $data = $response->json();
        $operationName = $data['name'] ?? null;

        if (!$operationName) {
            Log::error('No operation name in Veo response', ['data' => $data]);
            return response()->json(['error' => 'Failed to start video generation'], 500);
        }

        // Encode operation name for URL safety
        $requestId = base64_encode($operationName);
        
        Log::info("Video generation initiated. Operation: {$operationName}");

        return response()->json([
            'status' => 'initiated',
            'requestId' => $requestId,
            'type' => 'videos',
            'message' => 'Video generation started. Poll /api/generate/status/{requestId}?type=videos for updates.'
        ]);
    }

    /**
     * Скачивает изображение по URL и возвращает base64.
     */
    private function fetchImageAsBase64($url)
    {
        $response = Http::timeout(30)->get($url);
        
        if (!$response->successful()) {
            throw new \Exception("Failed to fetch image: HTTP " . $response->status());
        }

        $contentType = $response->header('Content-Type') ?? 'image/jpeg';
        // Normalize mime type
        if (str_contains($contentType, ';')) {
            $contentType = trim(explode(';', $contentType)[0]);
        }

        return [
            'mime_type' => $contentType,
            'data' => base64_encode($response->body())
        ];
    }

    /**
     * Сохраняет base64 изображение в storage и возвращает URL.
     */
    private function saveBase64Image($imageData)
    {
        $mimeType = $imageData['mimeType'] ?? $imageData['mime_type'] ?? 'image/png';
        $data = $imageData['data'] ?? '';
        
        $extension = match($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => 'png'
        };

        $filename = 'gen_' . Str::random(16) . '_' . time() . '.' . $extension;
        $path = 'generations/' . $filename;

        Storage::disk('public')->put($path, base64_decode($data));

        return url('storage/' . $path);
    }

    /**
     * Скачивает видео через Gemini Files API и сохраняет локально.
     */
    private function downloadAndSaveVideo($apiKey, $videoFile)
    {
        // videoFile содержит информацию о файле, включая URI
        $fileUri = $videoFile['uri'] ?? null;
        $fileName = $videoFile['name'] ?? null;

        if (!$fileUri && !$fileName) {
            throw new \Exception('No video URI or name in response');
        }

        // Скачиваем через Files API
        $downloadUrl = $fileUri ?? (self::GEMINI_API_BASE . "/files/{$fileName}:download?key={$apiKey}");
        
        // Если это Gemini file reference, скачиваем через API
        if ($fileName && !$fileUri) {
            $response = Http::timeout(120)
                ->get(self::GEMINI_API_BASE . "/files/{$fileName}?key={$apiKey}&alt=media");
        } else {
            // Прямая ссылка
            $response = Http::timeout(120)->get($downloadUrl);
        }

        if (!$response->successful()) {
            throw new \Exception('Failed to download video: HTTP ' . $response->status());
        }

        $filename = 'vid_' . Str::random(16) . '_' . time() . '.mp4';
        $path = 'generations/' . $filename;

        Storage::disk('public')->put($path, $response->body());

        return url('storage/' . $path);
    }
}
