
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Post, SearchResult, ProductSearchResult } from '../types';
import PostCard from '../components/PostCard';
import Notification from '../components/Notification';
import { postsApi, searchApi, favoriteExternalShopsApi, shopsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface FeedViewProps {
  onSelectPost: (post: Post, list: Post[]) => void;
  onFitPost: (post: Post) => void;
  onNavigateToProfile: (username: string) => void;
  onNavigateToShop?: (slug: string) => void;
}

// Fallback mock data
const MOCK_POSTS: Post[] = [
  { id: 'h1', imageUrl: '/mock/uploaded_image_0_1767382693233.png', author: '@vogue_edge', likes: 3200, isPrivate: false, tags: ['Minimal'] },
  { id: 'h2', imageUrl: '/mock/uploaded_image_1_1767382693233.png', author: '@urban_knight', likes: 1150, isPrivate: false, tags: ['Techwear'] },
  { id: 'h3', imageUrl: '/mock/uploaded_image_2_1767382693233.png', author: '@luxe_daily', likes: 2800, isPrivate: false, tags: ['Silk'] },
  { id: 'h4', imageUrl: '/mock/uploaded_image_3_1767382693233.png', author: '@nordic_style', likes: 940, isPrivate: false, tags: ['Scandi'] },
  { id: 'h5', imageUrl: '/mock/uploaded_image_4_1767382693233.png', author: '@office_chic', likes: 1500, isPrivate: false, tags: ['Business'] },
  { id: 'h6', imageUrl: '/mock/uploaded_image_0_1767382807800.png', author: '@denim_cult', likes: 2100, isPrivate: false, tags: ['Casual'] },
  { id: 'h7', imageUrl: '/mock/uploaded_image_1_1767382807800.png', author: '@fit_life', likes: 3400, isPrivate: false, tags: ['Sport'] },
  { id: 'h8', imageUrl: '/mock/uploaded_image_2_1767382807800.png', author: '@autumn_vibes', likes: 1800, isPrivate: false, tags: ['Outerwear'] },
  { id: 'h9', imageUrl: '/mock/uploaded_image_3_1767382807800.png', author: '@boho_soul', likes: 2200, isPrivate: false, tags: ['Boho'] },
];

type SearchMode = 'posts' | 'shops';

const FeedView: React.FC<FeedViewProps> = ({ onSelectPost, onFitPost, onNavigateToProfile, onNavigateToShop }) => {
  const { isAuthenticated, requireAuth } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('posts');
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [shopResults, setShopResults] = useState<SearchResult[]>([]);
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [favoriteShopDomains, setFavoriteShopDomains] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ message: string } | null>(null);
  const [popularShops, setPopularShops] = useState<{ id: number; name: string; slug: string; logoUrl: string | null; domain: string; externalUrl: string | null }[]>([]);

  // Toggle favorite shop
  const handleToggleFavorite = (domain: string, url: string) => {
    requireAuth(async () => {
      try {
        const isFavorite = favoriteShopDomains.has(domain);
        if (isFavorite) {
          await favoriteExternalShopsApi.remove(domain);
          setFavoriteShopDomains(prev => {
            const newSet = new Set(prev);
            newSet.delete(domain);
            return newSet;
          });
          setNotification({ message: `${domain} удалён из избранного` });
        } else {
          await favoriteExternalShopsApi.add(domain, url);
          setFavoriteShopDomains(prev => new Set([...prev, domain]));
          setNotification({ message: `${domain} добавлен в избранное` });
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
        setNotification({ message: 'Ошибка при обновлении избранного' });
      }
    });
  };

  // Check which shops are favorites when results change
  useEffect(() => {
    if (isAuthenticated && shopResults.length > 0) {
      const domains = shopResults.map(r => r.domain);
      favoriteExternalShopsApi.check(domains)
        .then(res => setFavoriteShopDomains(new Set(res.favorites)))
        .catch(() => { });
    }
  }, [isAuthenticated, shopResults]);

  // Load posts from API
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const posts = await postsApi.getAll();
        setAllPosts(posts.length > 0 ? posts : MOCK_POSTS);
      } catch (error) {
        console.log('API unavailable, using mock data');
        setAllPosts(MOCK_POSTS);
      } finally {
        setIsLoading(false);
      }
    };
    loadPosts();
  }, []);

  // Load popular shops
  useEffect(() => {
    shopsApi.getPopular()
      .then(shops => setPopularShops(shops))
      .catch(() => setPopularShops([]));
  }, []);

  // Search products when mode is 'posts' and query is entered
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchApi.searchProducts(query);
      setProductResults(results);
    } catch (error) {
      console.error('Product search failed:', error);
      setProductResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Search shops when mode is 'shops'
  const searchShops = useCallback(async (query: string) => {
    if (!query.trim() || searchMode !== 'shops') return;

    setIsSearching(true);
    try {
      const results = await searchApi.searchShops(query);
      setShopResults(results);
    } catch (error) {
      console.error('Shop search failed:', error);
      setShopResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchMode]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setShopResults([]);
      setProductResults([]);
      return;
    }

    const timer = setTimeout(() => {
      if (searchMode === 'posts') {
        searchProducts(searchQuery);
      } else {
        searchShops(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchMode, searchProducts, searchShops]);

  // Convert product results to Post format for display
  const productPosts = useMemo((): Post[] => {
    return productResults.map(p => ({
      id: p.id,
      imageUrl: p.imageUrl,
      author: `@${p.domain}`,
      likes: 0,
      isPrivate: false,
      tags: [p.price || 'Товар'],
      title: p.title,
      storeUrl: p.url, // Add storeUrl for "Buy" button
    }));
  }, [productResults]);

  // Show local posts if no search query, else show product results
  const displayPosts = useMemo(() => {
    if (!searchQuery.trim()) return allPosts;
    return productPosts;
  }, [searchQuery, allPosts, productPosts]);

  const handleShopClick = (result: SearchResult) => {
    window.open(result.url, '_blank', 'noopener,noreferrer');
  };

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    if (searchQuery.trim()) {
      if (mode === 'shops') {
        searchShops(searchQuery);
      } else {
        searchProducts(searchQuery);
      }
    }
  };

  const hasQuery = searchQuery.trim().length > 0;

  return (
    <div className="pb-8 pt-16 w-full px-1 md:px-6 max-w-7xl mx-auto animate-in fade-in duration-1000">
      <div className="flex flex-col items-center mb-12 md:mb-16 px-4">
        <h2 className="text-4xl md:text-7xl font-thin tracking-tight mb-8 md:mb-10 text-center uppercase tracking-[0.1em] !drop-shadow-none !text-shadow-[0_4px_12px_rgba(0,0,0,0.15)]">Поиск стиля</h2>

        <div className="w-full max-w-4xl relative group">
          <div className="absolute inset-y-0 left-6 md:left-8 flex items-center pointer-events-none">
            <span className="text-xl md:text-2xl opacity-50">🔍</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Платье, куртка, джинсы..."
            className="w-full pl-16 md:pl-20 pr-6 md:pr-8 py-5 md:py-6 liquid-glass rounded-full text-lg md:text-xl font-light tracking-tight placeholder-gray-400 focus:outline-none focus:ring-8 focus:ring-black/5 transition-all shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-6 md:right-8 flex items-center text-gray-400 hover:text-black transition-colors"
            >
              <span className="text-xl">✕</span>
            </button>
          )}
        </div>

        {/* Популярные магазины - показываются если нет поискового запроса */}
        {!hasQuery && popularShops.length > 0 && (
          <div className="w-full max-w-5xl mt-12 animate-in fade-in slide-in-from-bottom-2 duration-500 px-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 text-center">
              Популярные магазины
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularShops.map((shop) => (
                <div
                  key={shop.id}
                  onClick={() => onNavigateToShop?.(shop.slug)}
                  className="group bg-white rounded-3xl p-5 border border-gray-100 hover:border-black/20 hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Логотип или заглушка */}
                    {shop.logoUrl ? (
                      <img
                        src={shop.logoUrl}
                        alt={shop.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                        <span className="text-sm font-bold text-gray-400">
                          {shop.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <h3 className="font-bold text-lg text-black truncate group-hover:text-black/70 transition-colors">
                      {shop.name}
                    </h3>
                  </div>

                  {shop.externalUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(shop.externalUrl!, '_blank', 'noopener,noreferrer');
                      }}
                      className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-black hover:text-white transition-all shrink-0"
                      title="Перейти на сайт магазина"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17L17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Фильтр Образы/Магазины */}
        {hasQuery && (
          <div className="flex gap-2 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <button
              onClick={() => handleModeChange('posts')}
              className={`px-6 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${searchMode === 'posts'
                ? 'bg-black text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-black'
                }`}
            >
              Образы
            </button>
            <button
              onClick={() => handleModeChange('shops')}
              className={`px-6 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${searchMode === 'shops'
                ? 'bg-black text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-black'
                }`}
            >
              Магазины
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-6 md:mb-8 px-4">
        {hasQuery && (
          <p className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase">
            {searchMode === 'posts'
              ? `${displayPosts.length} товаров найдено`
              : `${shopResults.length} магазинов найдено`}
          </p>
        )}
      </div>

      {/* Контент в зависимости от режима */}
      {isLoading || isSearching ? (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="mt-4 text-sm text-gray-400">Загрузка...</p>
        </div>
      ) : searchMode === 'posts' ? (
        // Режим "Образы" - показываем товары или локальные посты
        displayPosts.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4 w-full px-1 md:px-0 space-y-2 md:space-y-4">
            {displayPosts.map(post => (
              <div key={post.id} className="break-inside-avoid mb-2 md:mb-4">
                <PostCard
                  post={post}
                  onClick={(p) => onSelectPost(p, displayPosts)}
                  onFitClick={(e, p) => onFitPost(p)}
                  onAuthorClick={onNavigateToProfile}
                  hideActions={true}
                  storeUrl={(post as any).storeUrl}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 animate-in fade-in zoom-in duration-500">
            <div className="text-8xl mb-8 opacity-10">🔍</div>
            <h3 className="text-xl md:text-2xl font-thin text-gray-400 tracking-tight">Ничего не найдено</h3>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-black hover:underline"
            >
              Сбросить фильтры
            </button>
          </div>
        )
      ) : (
        // Режим "Магазины"
        shopResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
            {shopResults.map((result, index) => (
              <div
                key={`${result.domain}-${index}`}
                className="group bg-white rounded-3xl p-6 border border-gray-100 hover:border-black/20 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-black truncate group-hover:text-black/80 transition-colors">
                      {result.domain}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(result.domain, result.url);
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${favoriteShopDomains.has(result.domain)
                        ? 'bg-red-50 text-red-500'
                        : 'bg-gray-100 hover:bg-red-50 hover:text-red-500'
                        }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={favoriteShopDomains.has(result.domain) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleShopClick(result)}
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17L17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hasQuery ? (
          <div className="flex flex-col items-center justify-center py-40 animate-in fade-in zoom-in duration-500">
            <div className="text-8xl mb-8 opacity-10">🏪</div>
            <h3 className="text-xl md:text-2xl font-thin text-gray-400 tracking-tight">Магазины не найдены</h3>
            <p className="text-sm text-gray-400 mt-2">Попробуйте другой запрос</p>
          </div>
        ) : null
      )}

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default FeedView;
