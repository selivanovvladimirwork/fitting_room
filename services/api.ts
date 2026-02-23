/**
 * API Service for FittingRoom
 * Взаимодействие с backend
 */

import { User, SubscriptionPlan, TokenPackage } from '../types';

// Автоопределение: локалка или продакшен
const API_BASE = window.location.hostname === 'fittingroom.loc'
    ? 'https://fittingadmin.loc/api'
    : 'https://admin.vgarderob.com/api';

// Получить токен из localStorage
const getToken = (): string | null => {
    return localStorage.getItem('auth_token');
};

// Базовые headers для запросов
const getHeaders = (includeAuth = false): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (includeAuth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
};

// Обработка ответа
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
}

// ==================== Auth API ====================
export const authApi = {
    async login(email: string, password: string) {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ email, password }),
        });
        const data = await handleResponse<{ user: any; token: string }>(response);
        localStorage.setItem('auth_token', data.token);
        return data;
    },

    async register(name: string, nickname: string, email: string, phone: string, password: string, password_confirmation: string) {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name, nickname, email, phone, password, password_confirmation }),
        });
        const data = await handleResponse<{ user: any; token: string }>(response);
        localStorage.setItem('auth_token', data.token);
        return data;
    },

    async logout() {
        try {
            await fetch(`${API_BASE}/logout`, {
                method: 'POST',
                headers: getHeaders(true),
            });
        } finally {
            localStorage.removeItem('auth_token');
        }
    },

    async updateProfile(data: { name?: string; nickname?: string; bio?: string }) {
        const response = await fetch(`${API_BASE}/user/profile`, {
            method: 'PUT',
            headers: getHeaders(true),
            body: JSON.stringify(data),
        });
        return handleResponse<{ user: any }>(response);
    },

    async getUser() {
        const response = await fetch(`${API_BASE}/user`, {
            headers: getHeaders(true),
        });
        return handleResponse<User>(response);
    },

    isAuthenticated(): boolean {
        return !!getToken();
    },
};

// ==================== Posts API ====================
export const postsApi = {
    async getAll() {
        const response = await fetch(`${API_BASE}/posts`, {
            headers: getHeaders(),
        });
        return handleResponse<any[]>(response);
    },

    async getOne(id: string) {
        const response = await fetch(`${API_BASE}/posts/${id}`, {
            headers: getHeaders(),
        });
        return handleResponse<any>(response);
    },

    async getByUser(username: string) {
        // Remove @ if present
        const cleanUsername = username.replace('@', '');
        const response = await fetch(`${API_BASE}/users/${cleanUsername}/posts`, {
            headers: getHeaders(),
        });
        return handleResponse<any[]>(response);
    },

    async create(data: { image_url: string; title?: string; tags?: string[]; is_private?: boolean; store_url?: string }) {
        const response = await fetch(`${API_BASE}/posts`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(data),
        });
        return handleResponse<any>(response);
    },
};

// ==================== Avatars (Digital Twins) API ====================
export const avatarsApi = {
    async getAll() {
        const response = await fetch(`${API_BASE}/avatars`, {
            headers: getHeaders(true),
        });
        return handleResponse<any[]>(response);
    },

    async create(data: { name: string; referenceImages: string[]; stats: any }) {
        const response = await fetch(`${API_BASE}/avatars`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(data),
        });
        return handleResponse<any>(response);
    },

    async update(id: string, data: Partial<{ name: string; referenceImages: string[]; stats: any }>) {
        const response = await fetch(`${API_BASE}/avatars/${id}`, {
            method: 'PUT',
            headers: getHeaders(true),
            body: JSON.stringify(data),
        });
        return handleResponse<any>(response);
    },

    async delete(id: string) {
        const response = await fetch(`${API_BASE}/avatars/${id}`, {
            method: 'DELETE',
            headers: getHeaders(true),
        });
        return handleResponse<{ success: boolean }>(response);
    },
};

// ==================== Wardrobe API (Personal Items) ====================
export const wardrobeApi = {
    async getAll() {
        const response = await fetch(`${API_BASE}/wardrobe`, {
            headers: getHeaders(true), // Requires auth
        });
        return handleResponse<any[]>(response);
    },

    async add(data: { image_url: string; title?: string; brand?: string; store_url?: string }) {
        const response = await fetch(`${API_BASE}/wardrobe`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(data),
        });
        return handleResponse<any>(response);
    },

    async remove(id: string) {
        // Extract numeric id from "product-123" format
        const numericId = id.replace('product-', '');
        const response = await fetch(`${API_BASE}/wardrobe/${numericId}`, {
            method: 'DELETE',
            headers: getHeaders(true),
        });
        return handleResponse<{ success: boolean }>(response);
    },
};

// ==================== Catalog API (System Products) ====================
export const catalogApi = {
    async getAll() {
        const response = await fetch(`${API_BASE}/catalog`, {
            headers: getHeaders(),
        });
        return handleResponse<any[]>(response);
    },
};

// ==================== Generation API ====================
export const generationApi = {
    async generateImage(data: { model: string; messages: any[] }, retryCount = 0): Promise<any> {
        const MAX_RETRIES = 3;

        // 1. Инициируем генерацию
        const initResponse = await fetch(`${API_BASE}/generate`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(data),
        });

        const initResult = await handleResponse<{
            status: string;
            requestId?: string;
            type?: string;
            result_url?: string;
            is_valid?: boolean;
            choices?: any[];
            error?: string;
        }>(initResponse);

        if (initResult.error) {
            throw new Error(initResult.error);
        }

        // Если генерация уже завершена (синхронный режим для изображений)
        if (initResult.status === 'completed') {
            console.log('[Generation] Completed immediately!', initResult.result_url);
            // Check validation
            if (initResult.is_valid === false && retryCount < MAX_RETRIES) {
                console.warn(`[Generation] Validation failed, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
                return this.generateImage(data, retryCount + 1);
            }
            return initResult;
        }

        const { requestId, type } = initResult;
        console.log(`[Generation] Initiated. RequestId: ${requestId}, Type: ${type}`);

        // 2. Polling статуса (Veo может занимать до 6+ минут)
        const maxAttempts = 120; // 120 * 5 сек = 600 сек (10 минут)
        const pollInterval = 5000; // 5 сек

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));

            console.log(`[Generation] Polling attempt ${attempt + 1}/${maxAttempts}...`);

            const statusResponse = await fetch(
                `${API_BASE}/generate/status/${requestId}?type=${type}`,
                { headers: getHeaders() }
            );

            const statusResult = await handleResponse<{
                status: string;
                result_url?: string;
                is_valid?: boolean;
                choices?: any[];
                error?: string;
            }>(statusResponse);

            if (statusResult.status === 'completed') {
                console.log('[Generation] Completed!', statusResult.result_url);

                // Check validation - if invalid, retry
                if (statusResult.is_valid === false && retryCount < MAX_RETRIES) {
                    console.warn(`[Generation] Validation failed - result doesn't show person wearing clothing. Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
                    return this.generateImage(data, retryCount + 1);
                }

                if (statusResult.is_valid === false) {
                    console.warn('[Generation] Validation failed but max retries reached, returning anyway');
                }

                // Возвращаем в старом формате для совместимости с остальным кодом
                return statusResult;
            }

            if (statusResult.status === 'failed') {
                throw new Error(statusResult.error || 'Generation failed');
            }

            // Иначе продолжаем polling (status === 'processing')
        }

        throw new Error('Generation timeout');
    },
};

// ==================== Search API ====================
export const searchApi = {
    async searchShops(query: string) {
        const response = await fetch(`${API_BASE}/search`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ query }),
        });
        return handleResponse<{ title: string; url: string; snippet: string; domain: string }[]>(response);
    },

    async searchProducts(query: string) {
        const response = await fetch(`${API_BASE}/search/products`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ query }),
        });
        return handleResponse<{ id: string; imageUrl: string; title: string; url: string; domain: string; price?: string }[]>(response);
    },
};

// ==================== Shops API ====================
export const shopsApi = {
    async getAll() {
        const response = await fetch(`${API_BASE}/shops`, {
            headers: getHeaders(),
        });
        return handleResponse<any[]>(response);
    },

    async getPopular() {
        const response = await fetch(`${API_BASE}/shops/popular`, {
            headers: getHeaders(),
        });
        return handleResponse<any[]>(response);
    },

    async getBySlug(slug: string) {
        const response = await fetch(`${API_BASE}/shops/${slug}`, {
            headers: getHeaders(),
        });
        return handleResponse<any>(response);
    },

    async getFavorites() {
        const response = await fetch(`${API_BASE}/shops/favorites`, {
            headers: getHeaders(true),
        });
        return handleResponse<any[]>(response);
    },

    async addFavorite(shopId: number) {
        const response = await fetch(`${API_BASE}/shops/${shopId}/favorite`, {
            method: 'POST',
            headers: getHeaders(true),
        });
        return handleResponse<{ success: boolean }>(response);
    },

    async removeFavorite(shopId: number) {
        const response = await fetch(`${API_BASE}/shops/${shopId}/favorite`, {
            method: 'DELETE',
            headers: getHeaders(true),
        });
        return handleResponse<{ success: boolean }>(response);
    },
};

// ==================== Favorite External Shops API (from search) ====================
export const favoriteExternalShopsApi = {
    async getAll() {
        const response = await fetch(`${API_BASE}/favorite-external-shops`, {
            headers: getHeaders(true),
        });
        return handleResponse<{ id: number; domain: string; url: string; addedAt: string }[]>(response);
    },

    async add(domain: string, url?: string) {
        const response = await fetch(`${API_BASE}/favorite-external-shops`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify({ domain, url }),
        });
        return handleResponse<{ id: number; domain: string; url: string; addedAt: string }>(response);
    },

    async remove(domain: string) {
        const response = await fetch(`${API_BASE}/favorite-external-shops/${encodeURIComponent(domain)}`, {
            method: 'DELETE',
            headers: getHeaders(true),
        });
        return handleResponse<{ message: string }>(response);
    },

    async check(domains: string[]) {
        const response = await fetch(`${API_BASE}/favorite-external-shops/check`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify({ domains }),
        });
        return handleResponse<{ favorites: string[] }>(response);
    },
};

// ==================== Saved Looks API (Гардероб - сохранённые генерации) ====================
export const savedLooksApi = {
    async getAll() {
        const response = await fetch(`${API_BASE}/saved-looks`, {
            headers: getHeaders(true),
        });
        return handleResponse<any[]>(response);
    },

    async add(data: { image_url: string; title?: string; brand?: string; store_url?: string }) {
        const response = await fetch(`${API_BASE}/saved-looks`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(data),
        });
        return handleResponse<any>(response);
    },

    async remove(id: string) {
        const response = await fetch(`${API_BASE}/saved-looks/${id}`, {
            method: 'DELETE',
            headers: getHeaders(true),
        });
        return handleResponse<{ message: string }>(response);
    },
};

// ==================== Post Groups API ====================
export const postGroupsApi = {
    async getAll() {
        const response = await fetch(`${API_BASE}/post-groups`, {
            headers: getHeaders(true),
        });
        return handleResponse<any[]>(response);
    },

    async create(data: { name: string; posts: any[] }) {
        const response = await fetch(`${API_BASE}/post-groups`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(data),
        });
        return handleResponse<any>(response);
    },

    async update(id: string, data: { name?: string; posts?: any[] }) {
        const response = await fetch(`${API_BASE}/post-groups/${id}`, {
            method: 'PUT',
            headers: getHeaders(true),
            body: JSON.stringify(data),
        });
        return handleResponse<any>(response);
    },

    async delete(id: string) {
        const response = await fetch(`${API_BASE}/post-groups/${id}`, {
            method: 'DELETE',
            headers: getHeaders(true),
        });
        return handleResponse<{ success: boolean }>(response);
    },

    async sync(groups: any[]) {
        const response = await fetch(`${API_BASE}/post-groups/sync`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify({ groups }),
        });
        return handleResponse<any[]>(response);
    },
};

// ==================== Profile Data API ====================
export const profileApi = {
    async getMyPosts() {
        const response = await fetch(`${API_BASE}/profile/posts`, {
            headers: getHeaders(true),
        });
        return handleResponse<any[]>(response);
    },

    async getFollowing() {
        const response = await fetch(`${API_BASE}/profile/following`, {
            headers: getHeaders(true),
        });
        return handleResponse<any[]>(response);
    },

    async getSavedPosts() {
        const response = await fetch(`${API_BASE}/profile/saved`, {
            headers: getHeaders(true),
        });
        return handleResponse<any[]>(response);
    },

    async getLikedPosts() {
        const response = await fetch(`${API_BASE}/profile/liked`, {
            headers: getHeaders(true),
        });
        return handleResponse<any[]>(response);
    },

    async likePost(postId: string | number) {
        const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
            method: 'POST',
            headers: getHeaders(true),
        });
        return handleResponse<{ message: string; likes: number }>(response);
    },

    async unlikePost(postId: string | number) {
        const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
            method: 'DELETE',
            headers: getHeaders(true),
        });
        return handleResponse<{ message: string; likes: number }>(response);
    },

    async savePost(postId: string | number) {
        const response = await fetch(`${API_BASE}/posts/${postId}/save`, {
            method: 'POST',
            headers: getHeaders(true),
        });
        return handleResponse<{ message: string }>(response);
    },

    async unsavePost(postId: string | number) {
        const response = await fetch(`${API_BASE}/posts/${postId}/save`, {
            method: 'DELETE',
            headers: getHeaders(true),
        });
        return handleResponse<{ message: string }>(response);
    },

    async followUser(userId: string | number) {
        const response = await fetch(`${API_BASE}/users/${userId}/follow`, {
            method: 'POST',
            headers: getHeaders(true),
        });
        return handleResponse<{ message: string }>(response);
    },

    async unfollowUser(userId: string | number) {
        const response = await fetch(`${API_BASE}/users/${userId}/follow`, {
            method: 'DELETE',
            headers: getHeaders(true),
        });
        return handleResponse<{ message: string }>(response);
    },
};

// ==================== Migration API ====================
export const migrationApi = {
    async migrateLocalData(data: { avatars?: any[]; wardrobe?: any[] }) {
        const response = await fetch(`${API_BASE}/migrate-local-data`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(data),
        });
        return handleResponse<{ success: boolean; imported: any }>(response);
    },
};

// ==================== Payment API ====================
export const paymentApi = {
    async getPackages() {
        const response = await fetch(`${API_BASE}/packages`, {
            headers: getHeaders(true),
        });
        return handleResponse<TokenPackage[]>(response);
    },

    async purchasePackage(packageId: number) {
        const response = await fetch(`${API_BASE}/purchase-package`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify({ package_id: packageId }),
        });
        return handleResponse<{ success: boolean; message: string; new_balance: number }>(response);
    },

    async getSubscriptionPlans() {
        const response = await fetch(`${API_BASE}/subscription-plans`, {
            headers: getHeaders(true),
        });
        return handleResponse<SubscriptionPlan[]>(response);
    },

    async subscribe(planId: number) {
        const response = await fetch(`${API_BASE}/subscribe`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify({ plan_id: planId }),
        });
        return handleResponse<{ success: boolean; message: string }>(response);
    }
};

// ==================== Helper: Migrate localStorage on first login ====================
export async function migrateLocalStorageToApi(): Promise<void> {
    const migrationDone = localStorage.getItem('api_migration_done');
    if (migrationDone) return;

    const avatars = localStorage.getItem('user_avatars_v2');
    const wardrobe = localStorage.getItem('fitting_room_wardrobe');

    const data: any = {};
    if (avatars) data.avatars = JSON.parse(avatars);
    if (wardrobe) data.wardrobe = JSON.parse(wardrobe);

    if (Object.keys(data).length > 0) {
        try {
            await migrationApi.migrateLocalData(data);

            // Clear localStorage after successful migration
            localStorage.removeItem('user_avatars_v2');
            localStorage.removeItem('user_avatars');
            localStorage.removeItem('fitting_room_wardrobe');
            localStorage.removeItem('active_avatar_id');

            localStorage.setItem('api_migration_done', 'true');
            console.log('localStorage data migrated to API successfully');
        } catch (error) {
            console.error('Failed to migrate localStorage to API:', error);
        }
    } else {
        localStorage.setItem('api_migration_done', 'true');
    }
}

export default {
    auth: authApi,
    posts: postsApi,
    avatars: avatarsApi,
    wardrobe: wardrobeApi,
    catalog: catalogApi,
    migration: migrationApi,
    generation: generationApi,
    shops: shopsApi,
    payment: paymentApi,
    migrateLocalStorageToApi,
};
