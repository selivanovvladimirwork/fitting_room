<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiApiSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerationController extends Controller
{
    public function generate(Request $request)
    {
        $request->validate([
            'messages' => 'required|array',
            'model' => 'required|string',
        ]);

        $settings = AiApiSetting::getInstance();
        $apiKey = $settings->photo_api_key;

        if (!$apiKey) {
            return response()->json(['error' => 'API Key not configured in backend'], 500);
        }

        try {
            $response = Http::timeout(120)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'HTTP-Referer' => $request->header('Origin') ?? config('app.url'),
                    'X-Title' => 'AI Fitting Room',
                    'Content-Type' => 'application/json',
                ])->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => $request->model,
                    'messages' => $request->messages,
                    'modalities' => ["image", "text"],
                ]);

            if (!$response->successful()) {
                Log::error('OpenRouter API Error', ['body' => substr($response->body(), 0, 500)]);
                return response()->json(['error' => 'Generation failed: ' . substr($response->body(), 0, 200)], $response->status());
            }

            return $response->json();

        } catch (\Exception $e) {
            Log::error('Generation Exception', ['message' => $e->getMessage()]);
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }
}
