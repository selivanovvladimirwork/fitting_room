import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi, migrateLocalStorageToApi } from '../services/api';

interface User {
    id: number;
    name: string;
    email: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
    requireAuth: (callback: () => void) => void;
    authError: string | null;
    clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

    const isAuthenticated = !!user;

    // Check auth on mount
    useEffect(() => {
        const checkAuth = async () => {
            if (authApi.isAuthenticated()) {
                try {
                    const userData = await authApi.getUser();
                    setUser(userData);
                } catch {
                    // Token invalid, clear it
                    localStorage.removeItem('auth_token');
                }
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setAuthError(null);
        try {
            const { user: userData } = await authApi.login(email, password);
            setUser(userData);
            setIsAuthModalOpen(false);

            // Migrate localStorage data after login
            await migrateLocalStorageToApi();

            // Execute pending callback if any
            if (pendingCallback) {
                pendingCallback();
                setPendingCallback(null);
            }
        } catch (error: any) {
            setAuthError(error.message || 'Ошибка входа');
            throw error;
        }
    }, [pendingCallback]);

    const register = useCallback(async (name: string, email: string, password: string, passwordConfirmation: string) => {
        setAuthError(null);
        try {
            const { user: userData } = await authApi.register(name, email, password, passwordConfirmation);
            setUser(userData);
            setIsAuthModalOpen(false);

            // Execute pending callback if any
            if (pendingCallback) {
                pendingCallback();
                setPendingCallback(null);
            }
        } catch (error: any) {
            setAuthError(error.message || 'Ошибка регистрации');
            throw error;
        }
    }, [pendingCallback]);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } finally {
            setUser(null);
        }
    }, []);

    const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
    const closeAuthModal = useCallback(() => {
        setIsAuthModalOpen(false);
        setAuthError(null);
        setPendingCallback(null);
    }, []);
    const clearAuthError = useCallback(() => setAuthError(null), []);

    const requireAuth = useCallback((callback: () => void) => {
        if (isAuthenticated) {
            callback();
        } else {
            setPendingCallback(() => callback);
            openAuthModal();
        }
    }, [isAuthenticated, openAuthModal]);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            isLoading,
            login,
            register,
            logout,
            isAuthModalOpen,
            openAuthModal,
            closeAuthModal,
            requireAuth,
            authError,
            clearAuthError,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
