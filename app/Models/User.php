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
        'tokens',
        'daily_generations_count',
        'last_generation_date',
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

    /**
     * Текущая подписка пользователя
     */
    public function subscription()
    {
        return $this->hasOne(Subscription::class)->latestOfMany();
    }

    /**
     * Активная подписка
     */
    public function activeSubscription()
    {
        return $this->hasOne(Subscription::class)
            ->where('status', 'active')
            ->where('expires_at', '>', now());
    }

    /**
     * Сбросить дневной лимит если наступил новый день
     */
    public function resetDailyUsageIfNeeded(): void
    {
        $today = now()->format('Y-m-d');
        if ($this->last_generation_date !== $today) {
            $this->daily_generations_count = 0;
            $this->last_generation_date = $today;
            $this->save();
        }
    }

    /**
     * Проверить, есть ли дневной лимит
     */
    public function hasDailyLimit(): bool
    {
        $this->resetDailyUsageIfNeeded();

        $subscription = $this->activeSubscription;
        $limit = $subscription ? $subscription->subscriptionPlan->photos_per_day : 1; // Default 1 for free/no-sub

        return $this->daily_generations_count < $limit;
    }

    /**
     * Проверить, есть ли токены
     */
    public function hasTokens(): bool
    {
        return $this->tokens > 0;
    }

    /**
     * Увеличить счетчик дневного использования
     */
    public function incrementDailyUsage(): void
    {
        $this->daily_generations_count++;
        $this->save();
    }

    /**
     * Списать токен
     */
    public function decrementTokens(int $amount = 1): void
    {
        if ($this->tokens >= $amount) {
            $this->tokens -= $amount;
            $this->save();
        }
    }
}
