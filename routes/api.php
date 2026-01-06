<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\DigitalTwinController;
use App\Http\Controllers\Api\WardrobeController;
use App\Http\Controllers\Api\MigrationController;
use App\Http\Controllers\Api\GenerationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Публичные роуты
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{post}', [PostController::class, 'show']);
Route::get('/wardrobe', [WardrobeController::class, 'index']);

// Защищённые роуты (требуют аутентификации)
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    
    // Posts
    Route::post('/posts', [PostController::class, 'store']);
    
    // Avatars (Digital Twins)
    Route::get('/avatars', [DigitalTwinController::class, 'index']);
    Route::post('/avatars', [DigitalTwinController::class, 'store']);
    Route::put('/avatars/{digitalTwin}', [DigitalTwinController::class, 'update']);
    Route::delete('/avatars/{digitalTwin}', [DigitalTwinController::class, 'destroy']);
    
    // Wardrobe
    Route::post('/wardrobe', [WardrobeController::class, 'store']);
    Route::delete('/wardrobe/{product}', [WardrobeController::class, 'destroy']);
    
    // Data Migration
    Route::post('/migrate-local-data', [MigrationController::class, 'migrateLocalData']);

    // AI Generation
    Route::post('/generate', [GenerationController::class, 'generate']);
});
