/**
 * API Service for FittingRoom
 * Взаимодействие с backend (fittingadmin.loc)
 */

const API_BASE = 'https://fittingadmin.loc/api';

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

    async register(name: string, email: string, password: string, password_confirmation: string) {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name, email, password, password_confirmation }),
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

    async getUser() {
        const response = await fetch(`${API_BASE}/user`, {
            headers: getHeaders(true),
        });
        return handleResponse<{ id: number; name: string; email: string }>(response);
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

    async create(data: { image_url: string; title?: string; tags?: string[]; is_private?: boolean }) {
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

// ==================== Wardrobe API ====================
export const wardrobeApi = {
    async getAll() {
        const response = await fetch(`${API_BASE}/wardrobe`, {
            headers: getHeaders(),
        });
        return handleResponse<any[]>(response);
    },

    async add(data: { image_url: string; title?: string; brand?: string }) {
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

// ==================== Migration API ====================
export const migrationApi = {
    async migrateLocalData(data: { avatars?: any[]; wardrobe?: any[]; collections?: any[] }) {
        const response = await fetch(`${API_BASE}/migrate-local-data`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(data),
        });
        return handleResponse<{ success: boolean; imported: any }>(response);
    },
};

// ==================== Helper: Migrate localStorage on first login ====================
export async function migrateLocalStorageToApi(): Promise<void> {
    const migrationDone = localStorage.getItem('api_migration_done');
    if (migrationDone) return;

    const avatars = localStorage.getItem('user_avatars_v2');
    const wardrobe = localStorage.getItem('fitting_room_wardrobe');
    const collections = localStorage.getItem('user_collections');

    const data: any = {};
    if (avatars) data.avatars = JSON.parse(avatars);
    if (wardrobe) data.wardrobe = JSON.parse(wardrobe);
    if (collections) data.collections = JSON.parse(collections);

    if (Object.keys(data).length > 0) {
        try {
            await migrationApi.migrateLocalData(data);

            // Clear localStorage after successful migration
            localStorage.removeItem('user_avatars_v2');
            localStorage.removeItem('user_avatars');
            localStorage.removeItem('fitting_room_wardrobe');
            localStorage.removeItem('user_collections');
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
    migration: migrationApi,
    migrateLocalStorageToApi,
};
