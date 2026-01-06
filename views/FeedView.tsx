
import React, { useState, useMemo, useEffect } from 'react';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import { postsApi } from '../services/api';

interface FeedViewProps {
  onSelectPost: (post: Post, list: Post[]) => void;
  onFitPost: (post: Post) => void;
  onNavigateToProfile: (username: string) => void;
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

const FeedView: React.FC<FeedViewProps> = ({ onSelectPost, onFitPost, onNavigateToProfile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allPosts, setAllPosts] = useState<Post[]>(MOCK_POSTS);
  const [isLoading, setIsLoading] = useState(true);

  // Load posts from API
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const posts = await postsApi.getAll();
        if (posts.length > 0) {
          setAllPosts(posts);
        }
      } catch (error) {
        console.log('API unavailable, using mock data');
      } finally {
        setIsLoading(false);
      }
    };
    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return allPosts;
    const query = searchQuery.toLowerCase();
    return allPosts.filter(post =>
      post.author.toLowerCase().includes(query) ||
      post.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [searchQuery, allPosts]);

  return (
    <div className="pb-8 pt-16 w-full px-1 md:px-6 max-w-7xl mx-auto animate-in fade-in duration-1000">
      <div className="flex flex-col items-center mb-12 md:mb-16 px-4">
        <h2 className="text-4xl md:text-7xl font-thin tracking-tight mb-8 md:mb-10 text-center uppercase tracking-[0.1em] !drop-shadow-none !text-shadow-[0_4px_12px_rgba(0,0,0,0.15)]">Поиск стиля</h2>

        <div className="w-full max-w-4xl relative group">
          <div className="absolute inset-y-0 left-6 md:left-8 flex items-center pointer-events-none">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-400 group-focus-within:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Стили, бренды или авторы..."
            className="w-full pl-16 md:pl-20 pr-6 md:pr-8 py-5 md:py-6 liquid-glass rounded-full text-lg md:text-xl font-light tracking-tight placeholder-gray-400 focus:outline-none focus:ring-8 focus:ring-black/5 transition-all shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-6 md:right-8 flex items-center text-gray-400 hover:text-black transition-colors"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 md:mb-8 px-4">
        {searchQuery.trim() && (
          <p className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase">
            {`${filteredPosts.length} Результатов найдено`}
          </p>
        )}
      </div>

      {filteredPosts.length > 0 ? (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4 space-y-4 w-full px-1 md:px-0">
          {filteredPosts.map(post => (
            <div key={post.id} className="break-inside-avoid mb-4">
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
      )}
    </div>
  );
};

export default FeedView;
