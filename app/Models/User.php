<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;

class User extends Authenticatable implements FilamentUser
{
    use HasApiTokens, HasFactory, Notifiable;

    public function canAccessPanel(Panel $panel): bool
    {
        return true; // Все пользователи могут войти в админку
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'nickname',
        'bio',
        'phone',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Посты пользователя
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Примерочная пользователя (товары из wardrobe)
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Цифровые двойники пользователя
     */
    public function digitalTwins(): HasMany
    {
        return $this->hasMany(DigitalTwin::class);
    }

    /**
     * Группы постов пользователя
     */
    public function postGroups(): HasMany
    {
        return $this->hasMany(PostGroup::class);
    }

    /**
     * На кого подписан пользователь
     */
    public function following(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'following_id')
            ->withTimestamps();
    }

    /**
     * Подписчики пользователя
     */
    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'following_id', 'follower_id')
            ->withTimestamps();
    }

    /**
     * Сохранённые посты
     */
    public function savedPosts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'saved_posts')
            ->withTimestamps('created_at', null);
    }

    /**
     * Лайкнутые посты
     */
    public function likedPosts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'liked_posts')
            ->withTimestamps('created_at', null);
    }

    /**
     * Избранные магазины
     */
    public function favoriteShops(): BelongsToMany
    {
        return $this->belongsToMany(Shop::class, 'favorite_shops')
            ->withTimestamps();
    }

    /**
     * Избранные внешние магазины (из поиска)
     */
    public function favoriteExternalShops(): HasMany
    {
        return $this->hasMany(FavoriteExternalShop::class);
    }

    /**
     * Сохранённые образы (гардероб)
     */
    public function savedLooks(): HasMany
    {
        return $this->hasMany(SavedLook::class);
    }
}
