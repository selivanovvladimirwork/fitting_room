
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import { profileApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PostDetailViewProps {
  post: Post;
  onBack: () => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  onSelectPost: (post: Post, list: Post[]) => void;
  onNavigateToProfile: (username: string) => void;
  onNavigateToShop?: (slug: string) => void;
  onFit: (post: Post) => void;
}

const PostDetailView: React.FC<PostDetailViewProps> = ({ post, onBack, onNavigate, onSelectPost, onNavigateToProfile, onNavigateToShop, onFit }) => {
  const { requireAuth, isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);

  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const handleLike = () => {
    requireAuth(async () => {
      try {
        if (isLiked) {
          const result = await profileApi.unlikePost(post.id);
          setLikesCount(result.likes);
        } else {
          const result = await profileApi.likePost(post.id);
          setLikesCount(result.likes);
        }
        setIsLiked(!isLiked);
      } catch (error) {
        console.error('Like error:', error);
      }
    });
  };

  const handleSave = () => {
    requireAuth(async () => {
      try {
        if (isSaved) {
          await profileApi.unsavePost(post.id);
        } else {
          await profileApi.savePost(post.id);
        }
        setIsSaved(!isSaved);
      } catch (error) {
        console.error('Save error:', error);
      }
    });
  };

  const handleFollow = () => {
    requireAuth(async () => {
      // Note: We need author's user ID, not username. For now, just toggle UI.
      // Backend would need to resolve username to ID or accept username.
      setIsFollowing(!isFollowing);
    });
  };

  const authorStats = useMemo(() => ({
    height: 178 + Math.floor(Math.random() * 10),
    weight: 70 + Math.floor(Math.random() * 15),
    waist: 75 + Math.floor(Math.random() * 10)
  }), [post.id]);

  const [similarPosts, setSimilarPosts] = useState<Post[]>([]);

  // Fetch and shuffle posts for similar section
  useEffect(() => {
    const fetchSimilarPosts = async () => {
      try {
        const { postsApi } = await import('../services/api');
        const allPosts = await postsApi.getAll();
        // Filter out current post and shuffle
        const filtered = allPosts.filter((p: Post) => p.id !== post.id);
        const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 8);
        setSimilarPosts(shuffled);
      } catch (error) {
        console.log('Failed to load similar posts');
      }
    };
    fetchSimilarPosts();
  }, [post.id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Reset states when post changes
    setIsLiked(false);
    setIsSaved(false);
    setIsFollowing(false);
    setLikesCount(post.likes || 0);
  }, [post.id, post.likes]);

  const productName = useMemo(() => {
    if (post.tags && post.tags.length > 0) return post.tags[0];
    return "Эксклюзивный образ";
  }, [post]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onNavigate('next');
    } else if (isRightSwipe) {
      onNavigate('prev');
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: 'Примерочная Studio',
        text: `Посмотрите на этот образ от ${post.author}!`,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Ссылка скопирована в буфер обмена');
    }
  };

  return (
    <div className="w-full py-8 md:py-12 px-1 md:px-6 max-w-7xl mx-auto animate-in fade-in duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-12 md:mb-20 px-4">
        <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto">
          {/* Back button - Oval shape on mobile, circular on desktop */}
          <button
            onClick={onBack}
            className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white rounded-full shadow-md border border-gray-50 hover:scale-110 transition-all"
          >
            <svg className="w-5 h-5 md:w-7 md:h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => onNavigateToProfile(post.author)}
            className="text-3xl md:text-5xl font-thin tracking-widest flex-grow text-left hover:opacity-60"
          >
            {post.author?.startsWith('@') ? post.author : `@${post.author}`}
          </button>
        </div>
        <button
          onClick={handleFollow}
          className={`w-full md:w-auto px-10 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95 ${isFollowing ? 'bg-gray-100 text-gray-400 border border-transparent' : 'bg-black text-white border border-white/20 hover:bg-gray-900'
            }`}
        >
          {isFollowing ? 'Подписки' : 'Подписаться'}
        </button>
      </div>

      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center md:items-start justify-center gap-10 md:gap-16 mb-24 md:mb-40 relative px-2">

        {/* Main Image Container with Swipe Support and Buttons */}
        <div
          className="flex-grow flex justify-center w-full md:w-auto relative group touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Wrapper to bind buttons to image edges */}
          <div className="relative w-full md:w-fit">

            {/* Navigation Buttons pinned to edges */}
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
              className="absolute -left-5 md:-left-12 top-1/2 -translate-y-1/2 w-10 h-10 md:w-16 md:h-16 xl:w-20 xl:h-20 liquid-glass rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl border-white z-30"
              aria-label="Предыдущий образ"
            >
              <svg className="w-5 h-5 md:w-8 md:h-8 xl:w-10 xl:h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
              className="absolute -right-5 md:-right-12 top-1/2 -translate-y-1/2 w-10 h-10 md:w-16 md:h-16 xl:w-20 xl:h-20 liquid-glass rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl border-white z-30"
              aria-label="Следующий образ"
            >
              <svg className="w-5 h-5 md:w-8 md:h-8 xl:w-10 xl:h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>

            <div className="rounded-[40px] md:rounded-[60px] overflow-hidden bg-gray-50 shadow-2xl border-[6px] md:border-[10px] border-white transition-all duration-700 relative w-full">
              <img
                src={post.imageUrl}
                alt="Fashion Detail"
                className="max-h-[70vh] md:max-h-[85vh] w-full md:w-auto object-cover md:object-contain mx-auto select-none pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full md:w-[450px] flex flex-col shrink-0">
          <div className="liquid-glass p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-xl border border-white h-full flex flex-col">
            <div className="mb-6 md:mb-8">
              {post.title && (
                <h3 className="text-2xl md:text-3xl font-light tracking-tight uppercase tracking-widest mb-4 md:mb-6">{post.title}</h3>
              )}

              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all ${isLiked ? 'text-[#FF4D4D] fill-[#FF4D4D]' : 'text-black'}`}
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button
                  onClick={handleSave}
                  className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all ${isSaved ? 'text-black fill-black' : 'text-black'}`}
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
                <button
                  onClick={handleShare}
                  className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-black transition-all"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Avatar stats - show only if available */}
            {(post as any).avatarStats && (
              <div className="space-y-3 md:space-y-4 mb-6 md:mb-auto">
                <div className="flex justify-between items-center py-3 md:py-4 border-b border-black/5">
                  <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">Рост</span>
                  <span className="text-base md:text-lg font-light">{(post as any).avatarStats.height} см</span>
                </div>
                <div className="flex justify-between items-center py-3 md:py-4 border-b border-black/5">
                  <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">Вес</span>
                  <span className="text-base md:text-lg font-light">{(post as any).avatarStats.weight} кг</span>
                </div>
                <div className="flex justify-between items-center py-3 md:py-4 border-b border-black/5">
                  <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">Талия</span>
                  <span className="text-base md:text-lg font-light">{(post as any).avatarStats.waist} см</span>
                </div>
              </div>
            )}

            {/* Shop Info Block */}
            {post.shop && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  {post.shop.logoUrl && (
                    <img src={post.shop.logoUrl} alt={post.shop.name} className="w-10 h-10 rounded-xl object-cover" />
                  )}
                  <div className="flex-1">
                    <button
                      onClick={() => onNavigateToShop?.(post.shop!.slug)}
                      className="text-sm font-bold hover:underline text-left"
                    >
                      {post.shop.name}
                    </button>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Магазин</p>
                  </div>
                  {post.shop.externalUrl && (
                    <a
                      href={post.shop.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-black text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-gray-900 transition-all"
                    >
                      В магазин
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 md:gap-3 mt-6 md:mt-8">
              <button
                onClick={() => onFit(post)}
                className="w-full py-3 bg-black text-white border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl hover:bg-gray-900 active:scale-95 transition-all duration-300"
              >
                ПРИМЕРИТЬ
              </button>
              {(post as any).storeUrl && (
                <a
                  href={(post as any).storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-white text-black border border-gray-200 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 active:scale-95 transition-all duration-300 text-center block"
                >
                  В МАГАЗИН
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Similar Items - Adjusted gap for mobile */}
      <div className="mt-24 md:mt-40">
        <h2 className="text-3xl md:text-5xl font-thin tracking-widest uppercase mb-10 md:mb-16 px-1">Похожие образы</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 px-1 md:px-0">
          {similarPosts.map((p) => (
            <div key={p.id}>
              <PostCard
                post={p}
                onClick={(post) => onSelectPost(post, similarPosts)}
                onFitClick={(e, p) => onFit(p)}
                onAuthorClick={onNavigateToProfile}
                hideActions={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div >
  );
};

export default PostDetailView;
