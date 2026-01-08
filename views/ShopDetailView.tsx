import React, { useState, useEffect } from 'react';
import { Shop, Post } from '../types';
import PostCard from '../components/PostCard';
import { shopsApi } from '../services/api';

interface ShopDetailViewProps {
    slug: string;
    onBack: () => void;
    onPostClick: (post: Post) => void;
    onNavigateToProfile: (username: string) => void;
}

const ShopDetailView: React.FC<ShopDetailViewProps> = ({ slug, onBack, onPostClick, onNavigateToProfile }) => {
    const [shop, setShop] = useState<(Shop & { posts?: Post[] }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        const loadShop = async () => {
            setLoading(true);
            try {
                const data = await shopsApi.getBySlug(slug);
                setShop(data);
            } catch (e) {
                console.error('Failed to load shop:', e);
            } finally {
                setLoading(false);
            }
        };
        loadShop();
    }, [slug]);

    const handleToggleFavorite = async () => {
        if (!shop) return;
        try {
            if (isFavorite) {
                await shopsApi.removeFavorite(shop.id);
                setIsFavorite(false);
            } else {
                await shopsApi.addFavorite(shop.id);
                setIsFavorite(true);
            }
        } catch (e) {
            console.error('Favorite toggle failed:', e);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-2 border-black rounded-full animate-spin border-t-transparent"></div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-lg text-gray-500">Магазин не найден</p>
                <button onClick={onBack} className="text-black underline">Назад</button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 pb-20 pt-16">
            {/* Header */}
            <div className="flex items-center gap-6 mb-12">
                <button
                    onClick={onBack}
                    className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-md border border-gray-50 hover:scale-110 transition-all"
                >
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {shop.logoUrl && (
                    <img src={shop.logoUrl} alt={shop.name} className="w-16 h-16 rounded-2xl object-cover border border-gray-100" />
                )}

                <div className="flex-1">
                    <h1 className="text-3xl font-black tracking-tight">{shop.name}</h1>
                    {shop.description && (
                        <p className="text-sm text-gray-500 mt-1">{shop.description}</p>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleToggleFavorite}
                        className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${isFavorite
                                ? 'bg-black text-white'
                                : 'bg-white border border-gray-200 hover:border-black'
                            }`}
                    >
                        {isFavorite ? 'В избранном' : 'В избранное'}
                    </button>

                    {shop.externalUrl && (
                        <a
                            href={shop.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-900 transition-all"
                        >
                            В магазин
                        </a>
                    )}
                </div>
            </div>

            {/* Shop Posts */}
            <h2 className="text-lg font-bold mb-6">Товары магазина</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shop.posts && shop.posts.length > 0 ? (
                    shop.posts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onClick={onPostClick}
                            onAuthorClick={onNavigateToProfile}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-gray-400">
                        Пока нет товаров
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopDetailView;
