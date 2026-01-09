
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Post, SearchResult } from '../types';
import PostCard from '../components/PostCard';
import { postsApi, searchApi, shopsApi } from '../services/api';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('posts');
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [shopResults, setShopResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchingShops, setIsSearchingShops] = useState(false);

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

  // Search shops when mode is 'shops' and query changes
  const searchShops = useCallback(async (query: string) => {
    if (!query.trim() || searchMode !== 'shops') return;

    setIsSearchingShops(true);
    try {
      const results = await searchApi.searchShops(query);
      setShopResults(results);
    } catch (error) {
      console.error('Shop search failed:', error);
      setShopResults([]);
    } finally {
      setIsSearchingShops(false);
    }
  }, [searchMode]);

  // Debounced shop search
  useEffect(() => {
    if (searchMode !== 'shops' || !searchQuery.trim()) {
      setShopResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchShops(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchMode, searchShops]);

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return allPosts;
    const query = searchQuery.toLowerCase();
    return allPosts.filter(post =>
      post.author.toLowerCase().includes(query) ||
      post.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [searchQuery, allPosts]);

  const handleShopClick = (result: SearchResult) => {
    // Открываем внешний сайт в новой вкладке
    window.open(result.url, '_blank', 'noopener,noreferrer');
  };

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    if (mode === 'shops' && searchQuery.trim()) {
      searchShops(searchQuery);
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
            placeholder="Стили, бренды, магазины..."
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

        {/* Фильтр Образы/Магазины - появляется только после ввода запроса */}
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
              ? `${filteredPosts.length} образов найдено`
              : `${shopResults.length} магазинов найдено`}
          </p>
        )}
      </div>

      {/* Контент в зависимости от режима */}
      {isLoading || isSearchingShops ? (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="mt-4 text-sm text-gray-400">Загрузка...</p>
        </div>
      ) : searchMode === 'posts' ? (
        // Режим "Образы"
        filteredPosts.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4 w-full px-1 md:px-0 space-y-2 md:space-y-4">
            {filteredPosts.map(post => (
              <div key={post.id} className="break-inside-avoid mb-2 md:mb-4">
                <PostCard
                  post={post}
                  onClick={(p) => onSelectPost(p, filteredPosts)}
                  onFitClick={(e, p) => onFitPost(p)}
                  onAuthorClick={onNavigateToProfile}
                  hideActions={true}
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
                onClick={() => handleShopClick(result)}
                className="group cursor-pointer bg-white rounded-3xl p-6 border border-gray-100 hover:border-black/20 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-black truncate group-hover:text-black/80 transition-colors">
                      {result.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                      {result.domain}
                    </p>
                    {result.snippet && (
                      <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                        {result.snippet}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                    <span className="text-lg">↗</span>
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
    </div>
  );
};

export default FeedView;
