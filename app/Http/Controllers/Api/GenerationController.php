<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiApiSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
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

        // Check token balance
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        // Determine requested model and cost
        $requestedModel = $request->model;
        $isVideo = str_contains(strtolower($requestedModel ?? ''), 'veo') || str_contains(strtolower($requestedModel ?? ''), 'kling');
        $cost = $isVideo ? 5 : 1;

        if ($user->tokens < $cost) {
            return response()->json([
                'error' => "Insufficient tokens. Required: {$cost}, Available: {$user->tokens}",
                'code' => 'INSUFFICIENT_TOKENS',
                'required_tokens' => $cost,
                'available_tokens' => $user->tokens
            ], 402);
        }

        // Deduct tokens
        $user->tokens -= $cost;
        $user->save();
        Log::info("User {$user->id} used {$cost} tokens for " . ($isVideo ? 'video' : 'image') . ". Remaining: {$user->tokens}");
        
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
    /**
     * Генерация через Replicate (Generic for Video & Image)
     */
    private function initiateReplicateGeneration($token, $model, $input, $isVideo)
    {
        // Подготовка входных параметров для Replicate
        $params = [];

        if ($model === 'cuuupid/idm-vton') {
            // == IDM-VTON SPECIFIC LOGIC ==
            $vtonInput = $this->parseVtonInput($input);
            
            if (!$vtonInput['human_img'] || !$vtonInput['garm_img']) {
                throw new \Exception("IDM-VTON requires both Human and Garment images.");
            }

            // Auto-generate caption if not provided
            $garmentDes = $vtonInput['garment_des'];
            if (empty($garmentDes)) {
                 $garmentDes = $this->getGarmentDescription($token, $vtonInput['garm_img']);
            }
            
            // Pre-process garment: Remove background/person to get clean garment
            $cleanGarmentUrl = $this->removeGarmentBackground($token, $vtonInput['garm_img']);
            
            // Refine category based on Vision Caption (since user Title might be generic "Clothing Item")
            $category = $vtonInput['category'] ?? 'upper_body';
            
            // Only refine if the initial detection was generic or default, OR always refine?
            // Vision is likely more accurate for uploads.
            $desLower = strtolower($garmentDes);
            
            if (Str::contains($desLower, ['dress', 'gown', 'frock', 'maxi', 'midi', 'mini'])) {
                $category = 'dresses';
            } elseif (Str::contains($desLower, ['pants', 'trousers', 'jeans', 'skirt', 'shorts', 'leggings', 'joggers', 'sweatpants'])) {
                $category = 'lower_body';
            } elseif (Str::contains($desLower, ['shirt', 'top', 'blouse', 'jacket', 'coat', 'sleeve', 't-shirt', 'sweater', 'hoodie'])) {
                $category = 'upper_body';
            }

            $params = [
                'human_img' => $this->ensureImageIsUrl($vtonInput['human_img']),
                'garm_img' => $cleanGarmentUrl, // Use segmented garment (no background/person)
                'garment_des' => $garmentDes,
                'category' => $category,
                'crop' => false, 
                'seed' => 42,
                'steps' => 30, 
            ];
            
            Log::info("IDM-VTON Params Prepared", ['category' => $params['category'], 'caption' => $garmentDes]);

        } elseif ($isVideo) {
            // Kling AI v2.5 Turbo Pro
            $params = [
                'prompt' => $input['prompt'],
                'duration' => 5,
                'aspect_ratio' => '9:16',
                'negative_prompt' => "",
                'cfg_scale' => 0.9,
                'mode' => 'pro'
            ];
             // Params: prompt, duration, aspect_ratio, input_image, negative_prompt
            
            $inputImages = $input['imageUrls'];
            if (!empty($input['imagesBase64'])) {
                foreach($input['imagesBase64'] as $img) {
                    $inputImages[] = 'data:' . $img['mime_type'] . ';base64,' . $img['data'];
                }
            }

            // If an image is provided, Kling uses 'start_image'
            if (!empty($inputImages)) {
                $params['start_image'] = $inputImages[0];
            }
        } else {
             // Fallback / Other models (Nano Banana etc)
            $params = [
                 'prompt' => $input['prompt'],
                 'output_format' => 'jpg'
            ];
             
            $inputImages = $input['imageUrls'];
             if (!empty($input['imagesBase64'])) {
                foreach($input['imagesBase64'] as $img) {
                    $inputImages[] = 'data:' . $img['mime_type'] . ';base64,' . $img['data'];
                }
            }

            if (!empty($inputImages)) {
                $params['image_input'] = $inputImages;
                $params['aspect_ratio'] = 'match_input_image';
            } else {
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

        return response()->json([
            'status' => 'initiated',
            'requestId' => $requestId,
            'type' => $isVideo ? 'videos' : 'images', 
            'message' => 'Generation started via Replicate.'
        ]);
    }
    
    /**
     * Specialized parser for VTON structured parsing
     */
    /**
     * Specialized parser for VTON structured parsing
     */
    private function parseVtonInput($parsedOpenRouter)
    {
        // Use the ordered list of images to correctly identify Human vs Garment
        // regardless of whether they are URL or Base64
        $images = $parsedOpenRouter['allImages'] ?? [];
        
        $humanImg = null;
        $garmImg = null;
        
        if (count($images) >= 2) {
             $humanImg = $images[0];
             // Garment is usually the last added image
             $garmImg = $images[count($images) - 1];
        } elseif (count($images) === 1) {
             // Maybe garment only provided? or human only? 
             // Assume Human provided, Garment missing - error case usually, but let's be safe
             $humanImg = $images[0];
        }

        // Auto-detect category from prompt text
        $prompt = strtolower($parsedOpenRouter['prompt']);
        $category = 'upper_body'; // default
        
        if (Str::contains($prompt, ['dress', 'gown', 'frock'])) {
            $category = 'dresses';
        } elseif (Str::contains($prompt, ['pants', 'trousers', 'jeans', 'skirt', 'shorts', 'leggings'])) {
            $category = 'lower_body';
        }

        // Generate description if not present (will be filled by BLIP-2 later)
        // For now pass just title if available in prompt, or null to trigger auto-captioning
        $description = null; 

        return [
            'human_img' => $humanImg,
            'garm_img' => $garmImg,
            'category' => $category,
            'garment_des' => $description
        ];
    }
    
    /**
     * Get automated description of the garment using BLIP-2 (Vision to Text)
     */
    private function getGarmentDescription($token, $imageUrl) 
    {
        try {
            Log::info("Generating caption for garment: " . substr($imageUrl, 0, 50));
            
            $response = Http::withToken($token)
                ->post(self::REPLICATE_API_BASE . "/models/salesforce/blip-2/predictions", [
                    'input' => [
                        'image' => $imageUrl,
                        'caption' => true,
                        // 'question' => 'Describe the clothing item in detail: fabric, color, pattern, style.' // Optional VQA
                    ]
                ]);
                
            if (!$response->successful()) {
                Log::warning("BLIP-2 Request Failed", ['body' => $response->body()]);
                return "clothing item";
            }
            
            $data = $response->json();
            $predId = $data['id'];
            
            // Poll for result (BLIP is fast ~1-2s)
            $attempts = 0;
            while ($attempts < 10) {
                sleep(1);
                $attempts++;
                
                $check = Http::withToken($token)->get(self::REPLICATE_API_BASE . "/predictions/{$predId}");
                $statusData = $check->json();
                
                if ($statusData['status'] === 'succeeded') {
                    $caption = $statusData['output'];
                    Log::info("Generated Caption: " . $caption);
                    return $caption;
                }
                
                if (in_array($statusData['status'], ['failed', 'canceled'])) {
                    break;
                }
            }
            
            return "clothing item";
            
        } catch (\Exception $e) {
            Log::error("Caption Generation Error: " . $e->getMessage());
            return "clothing item";
        }
    }
    
    /**
     * Remove background/person from garment image using RMBG-1.4
     * Returns a clean garment-only image URL
     */
    private function removeGarmentBackground($token, $imageUrl)
    {
        try {
            // Ensure we have a proper URL (not base64)
            $imageUrl = $this->ensureImageIsUrl($imageUrl);
            
            Log::info("Removing background from garment: " . substr($imageUrl, 0, 50));
            
            $response = Http::withToken($token)
                ->post(self::REPLICATE_API_BASE . "/models/cjwbw/rembg/predictions", [
                    'input' => [
                        'image' => $imageUrl
                    ]
                ]);
                
            if (!$response->successful()) {
                Log::warning("RMBG Request Failed", ['body' => $response->body()]);
                return $imageUrl; // Return original on error
            }
            
            $data = $response->json();
            $predId = $data['id'];
            
            // Poll for result (RMBG is usually fast ~2-5s)
            $attempts = 0;
            while ($attempts < 15) {
                sleep(1);
                $attempts++;
                
                $check = Http::withToken($token)->get(self::REPLICATE_API_BASE . "/predictions/{$predId}");
                $statusData = $check->json();
                
                if ($statusData['status'] === 'succeeded') {
                    $outputUrl = $statusData['output'];
                    Log::info("Background removed successfully");
                    
                    // Save the segmented image to local storage
                    try {
                        $savedUrl = $this->saveUrlToStorage($outputUrl, 'png');
                        return $savedUrl;
                    } catch (\Exception $e) {
                        return $outputUrl; // Use remote URL if save fails
                    }
                }
                
                if (in_array($statusData['status'], ['failed', 'canceled'])) {
                    Log::warning("RMBG failed, using original image");
                    break;
                }
            }
            
            return $imageUrl; // Return original on timeout
            
        } catch (\Exception $e) {
            Log::error("Background Removal Error: " . $e->getMessage());
            return $imageUrl; // Return original on error
        }
    }

    private function checkReplicateStatus($token, $requestId)
    {
        $response = Http::withToken($token)->get(self::REPLICATE_API_BASE . "/predictions/{$requestId}");
        
        if (!$response->successful()) {
            return response()->json(['error' => 'Replicate status check failed'], 500);
        }

        $data = $response->json();
        $status = $data['status']; 

        if ($status === 'succeeded') {
            $output = $data['output']; 
            // Output бывает array или string
            $resultUrl = is_array($output) ? $output[0] : $output;
            
            Log::info("Replicate completed: $resultUrl");

             try {
                $ext = str_contains($resultUrl, '.mp4') ? 'mp4' : 'jpg';
                $savedUrl = $this->saveUrlToStorage($resultUrl, $ext);
                $resultUrl = $savedUrl;
             } catch (\Exception $e) {
                Log::warning("Failed to save Replicate output locally, using remote URL", ['error' => $e->getMessage()]);
             }

            // Validate the result (only for images, not videos)
            $isValid = true;
            if (!str_contains($resultUrl, '.mp4')) {
                $isValid = $this->validateGenerationResult($token, $resultUrl);
            }

            return response()->json([
                'status' => 'completed',
                'result_url' => $resultUrl,
                'is_valid' => $isValid, // Frontend will handle retry if false
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
     * Validate generation result using Vision model (BLIP-2 VQA)
     * Checks if the image shows a person wearing clothing (not just garment or just person)
     */
    private function validateGenerationResult($token, $imageUrl)
    {
        try {
            Log::info("Validating generation result: " . substr($imageUrl, 0, 50));
            
            // Use BLIP-2 VQA (Visual Question Answering)
            $response = Http::withToken($token)
                ->post(self::REPLICATE_API_BASE . "/models/salesforce/blip-2/predictions", [
                    'input' => [
                        'image' => $imageUrl,
                        'question' => 'Does this image show a person wearing clothing? Answer yes or no.'
                    ]
                ]);
                
            if (!$response->successful()) {
                Log::warning("Validation request failed", ['body' => $response->body()]);
                return true; // Assume valid on error to not block
            }
            
            $data = $response->json();
            $predId = $data['id'];
            
            // Poll for result (BLIP is fast ~1-2s)
            $attempts = 0;
            while ($attempts < 10) {
                sleep(1);
                $attempts++;
                
                $check = Http::withToken($token)->get(self::REPLICATE_API_BASE . "/predictions/{$predId}");
                $statusData = $check->json();
                
                if ($statusData['status'] === 'succeeded') {
                    $answer = strtolower($statusData['output'] ?? '');
                    Log::info("Validation answer: " . $answer);
                    
                    // Check if the answer indicates valid result
                    $isValid = Str::contains($answer, 'yes');
                    
                    if (!$isValid) {
                        Log::warning("Generation validation FAILED - result does not show person wearing clothing");
                    }
                    
                    return $isValid;
                }
                
                if (in_array($statusData['status'], ['failed', 'canceled'])) {
                    break;
                }
            }
            
            return true; // Assume valid on timeout
            
        } catch (\Exception $e) {
            Log::error("Validation Error: " . $e->getMessage());
            return true; // Assume valid on error
        }
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
     * Convert Base64 Data URI to a public URL by saving to storage.
     * If already a URL, return as-is.
     */
    private function ensureImageIsUrl($imageData)
    {
        if (!$imageData) return null;
        
        // Already a URL
        if (!str_starts_with($imageData, 'data:')) {
            return $imageData;
        }

        // Parse Data URI
        if (!preg_match('/^data:(image\/([a-z]+));base64,(.+)$/', $imageData, $matches)) {
            Log::warning("Invalid data URI format");
            return $imageData; // Return as-is, let Replicate handle
        }

        $mimeType = $matches[1]; // e.g., image/jpeg
        $extension = $matches[2]; // e.g., jpeg
        $base64Data = $matches[3];
        
        // Decode and save
        $binary = base64_decode($base64Data);
        if (!$binary) {
            Log::warning("Failed to decode base64 image");
            return $imageData;
        }

        $filename = 'upload_' . Str::random(16) . '.' . $extension;
        $path = 'temp_uploads/' . $filename;
        
        Storage::disk('public')->put($path, $binary);
        $publicUrl = url('storage/' . $path);
        
        Log::info("Converted Base64 to URL", ['url' => $publicUrl]);
        
        return $publicUrl;
    }

    /**
     * Парсит сообщения (вспомогательный метод без изменений логики)
     */
    private function parseOpenRouterMessage($messages)
    {
        $imageUrls = [];
        $imagesBase64 = [];
        $allImages = []; // List preserving order
        $promptText = '';
        
        foreach ($messages ?? [] as $msg) {
            foreach ($msg['content'] ?? [] as $part) {
                if (($part['type'] ?? '') === 'image_url') {
                    $url = $part['image_url']['url'] ?? '';
                    if (!$url) continue;
                    
                    if (str_starts_with($url, 'data:')) {
                         if (preg_match('/^data:(image\/[a-z]+);base64,(.+)$/', $url, $matches)) {
                            $imgData = ['mime_type' => $matches[1], 'data' => $matches[2]];
                            $imagesBase64[] = $imgData;
                            $allImages[] = $url; // Keep full data URI in the ordered list
                        }
                    } else {
                        $imageUrls[] = $url;
                        $allImages[] = $url;
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
            'allImages' => $allImages,
            'prompt' => trim($promptText)
        ];
    }
}
