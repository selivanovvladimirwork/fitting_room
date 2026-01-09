<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\DigitalTwinController;
use App\Http\Controllers\Api\WardrobeController;
use App\Http\Controllers\Api\MigrationController;
use App\Http\Controllers\Api\GenerationController;
use App\Http\Controllers\Api\PostGroupController;
use App\Http\Controllers\Api\ProfileDataController;
use App\Http\Controllers\Api\ShopController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\FavoriteExternalShopController;

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
Route::get('/users/{nickname}/posts', [PostController::class, 'byUser']); // Посты пользователя по никнейму
Route::get('/catalog', [WardrobeController::class, 'catalog']); // Системные товары для примерки
Route::get('/shops', [ShopController::class, 'index']);
Route::get('/shops/popular', [ShopController::class, 'popular']);
Route::get('/shops/{slug}', [ShopController::class, 'show']);
Route::post('/search', [SearchController::class, 'search']);
Route::post('/search/products', [SearchController::class, 'searchProducts']);

// Защищённые роуты (требуют аутентификации)
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    
    // Profile Data
    Route::get('/profile/posts', [ProfileDataController::class, 'myPosts']);
    Route::get('/profile/following', [ProfileDataController::class, 'following']);
    Route::get('/profile/saved', [ProfileDataController::class, 'savedPosts']);
    Route::get('/profile/liked', [ProfileDataController::class, 'likedPosts']);
    
    // Post interactions
    Route::post('/posts/{post}/like', [ProfileDataController::class, 'likePost']);
    Route::delete('/posts/{post}/like', [ProfileDataController::class, 'unlikePost']);
    Route::post('/posts/{post}/save', [ProfileDataController::class, 'savePost']);
    Route::delete('/posts/{post}/save', [ProfileDataController::class, 'unsavePost']);
    
    // Follow/Unfollow
    Route::post('/users/{user}/follow', [ProfileDataController::class, 'followUser']);
    Route::delete('/users/{user}/follow', [ProfileDataController::class, 'unfollowUser']);
    
    // Posts
    Route::post('/posts', [PostController::class, 'store']);
    
    // Avatars (Digital Twins)
    Route::get('/avatars', [DigitalTwinController::class, 'index']);
    Route::post('/avatars', [DigitalTwinController::class, 'store']);
    Route::put('/avatars/{digitalTwin}', [DigitalTwinController::class, 'update']);
    Route::delete('/avatars/{digitalTwin}', [DigitalTwinController::class, 'destroy']);
    
    // Wardrobe (user's personal items)
    Route::get('/wardrobe', [WardrobeController::class, 'index']);
    Route::post('/wardrobe', [WardrobeController::class, 'store']);
    Route::delete('/wardrobe/{product}', [WardrobeController::class, 'destroy']);
    
    // Post Groups
    Route::get('/post-groups', [PostGroupController::class, 'index']);
    Route::post('/post-groups', [PostGroupController::class, 'store']);
    Route::post('/post-groups/sync', [PostGroupController::class, 'sync']);
    Route::put('/post-groups/{postGroup}', [PostGroupController::class, 'update']);
    Route::delete('/post-groups/{postGroup}', [PostGroupController::class, 'destroy']);
    
    // Data Migration
    Route::post('/migrate-local-data', [MigrationController::class, 'migrateLocalData']);

    // AI Generation
    Route::post('/generate', [GenerationController::class, 'generate']);
    
    // Shop Favorites
    Route::get('/shops/favorites', [ShopController::class, 'favorites']);
    Route::post('/shops/{shop}/favorite', [ShopController::class, 'addFavorite']);
    Route::delete('/shops/{shop}/favorite', [ShopController::class, 'removeFavorite']);
    
    // Favorite External Shops (from search)
    Route::get('/favorite-external-shops', [FavoriteExternalShopController::class, 'index']);
    Route::post('/favorite-external-shops', [FavoriteExternalShopController::class, 'store']);
    Route::delete('/favorite-external-shops/{domain}', [FavoriteExternalShopController::class, 'destroy']);
    Route::post('/favorite-external-shops/check', [FavoriteExternalShopController::class, 'check']);
});

