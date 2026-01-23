import React, { useState, useMemo, useEffect } from 'react';
import { Post, Shop } from '../types';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { DigitalTwin } from '../types';
import VirtualFitView from './VirtualFitView';
import { postsApi, wardrobeApi, shopsApi, favoriteExternalShopsApi, profileApi, savedLooksApi } from '../services/api';

interface HomeViewProps {
  onStart: () => void;
  onSelectPost: (post: Post, list: Post[]) => void;
  onFitPost: (post: Post) => void;
  onNavigateToProfile: (username: string) => void;
  avatars: DigitalTwin[];
  activeAvatarId: string | null;
  onSetActiveAvatar: (id: string) => void;
  onSavePost?: (post: Post) => void;
  onNavigateToFeed?: () => void;
}

// Mock data removed - all posts come from API

const HomeView: React.FC<HomeViewProps & { userReferences?: string[], initialFittingPost?: Post | null }> = ({ onStart, onSelectPost, onFitPost, onNavigateToProfile, userReferences, initialFittingPost, avatars, activeAvatarId, onSetActiveAvatar, onSavePost, onNavigateToFeed }) => {
  const { isAuthenticated, requireAuth, user } = useAuth();
  const [showGeneration, setShowGeneration] = useState(true);
  const [curatedPosts, setCuratedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteShops, setFavoriteShops] = useState<Shop[]>([]);
  const [favoriteExternalShops, setFavoriteExternalShops] = useState<{ id: number; domain: string; url: string }[]>([]);
  const [followingUsers, setFollowingUsers] = useState<{ id: number; name: string; nickname: string }[]>([]);
  const [savedLooks, setSavedLooks] = useState<Post[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load generation history from localStorage (ALL generations, not just saved)
  const [generationHistory, setGenerationHistory] = useState<{ id: string, imageUrl: string, timestamp: number, clothTitle?: string }[]>(() => {
    try {
      const saved = localStorage.getItem('generation_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  // Lightbox state for history
  const [historyLightbox, setHistoryLightbox] = useState<{ id: string, imageUrl: string, timestamp: number, clothTitle?: string } | null>(null);
  const [notification, setNotification] = useState<{ message: string } | null>(null);
  const [wardrobeLoading, setWardrobeLoading] = useState(false);

  const handleHistoryAddToWardrobe = async (item: any) => {
    if (!item.imageUrl) return;
    setWardrobeLoading(true);
    try {
      await wardrobeApi.add({
        image_url: item.imageUrl,
        title: 'Сохраненная генерация'
      });
      setNotification({ message: 'Добавлено в гардероб' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error(error);
      setNotification({ message: 'Ошибка сохранения' });
    } finally {
      setWardrobeLoading(false);
      setHistoryLightbox(null);
    }
  };

  const handleHistoryPublish = (item: any) => {
    // Mock publish
    setNotification({ message: 'Опубликовано в ленту' });
    setTimeout(() => setNotification(null), 3000);
    setHistoryLightbox(null);
  };

  // Listen for localStorage changes to update history in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'generation_history' && e.newValue) {
        try {
          setGenerationHistory(JSON.parse(e.newValue));
        } catch { }
      }
    };

    // Also check periodically for same-tab updates (storage event doesn't fire in same tab)
    const interval = setInterval(() => {
      const saved = localStorage.getItem('generation_history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setGenerationHistory(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(parsed)) return parsed;
            return prev;
          });
        } catch { }
      }
    }, 1000);

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Poll savedLooks (Гардероб) for updates after saving new generation
  useEffect(() => {
    if (!isAuthenticated) return;

    const pollSavedLooks = setInterval(async () => {
      try {
        const newData = await savedLooksApi.getAll();
        setSavedLooks(prev => {
          if (prev.length !== newData.length || JSON.stringify(prev) !== JSON.stringify(newData)) {
            return newData;
          }
          return prev;
        });
      } catch { }
    }, 3000);

    return () => clearInterval(pollSavedLooks);
  }, [isAuthenticated]);


  // Handle external initial fitting post
  useEffect(() => {
    if (initialFittingPost) {
      setSelectedFittingItem(initialFittingPost);
      setShowGeneration(true);

      // Add to wardrobe if not present
      setWardrobe(prev => {
        if (prev.some(p => p.id === initialFittingPost.id)) return prev;
        return [initialFittingPost, ...prev];
      });
      setCurrentSlide(0);

      setTimeout(() => {
        const generationBlock = document.getElementById('generation-block');
        if (generationBlock) {
          generationBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [initialFittingPost]);

  // 1. Dynamic Wardrobe - load from API
  const [wardrobe, setWardrobe] = useState<Post[]>([]);



  useEffect(() => {
    const loadData = async () => {
      try {
        const [wardrobeData, postsData, shopsData, externalShopsData, followingData, savedLooksData] = await Promise.all([
          wardrobeApi.getAll().catch(() => []),
          postsApi.getAll().catch(() => []),
          isAuthenticated ? shopsApi.getFavorites().catch(() => []) : Promise.resolve([]),
          isAuthenticated ? favoriteExternalShopsApi.getAll().catch(() => []) : Promise.resolve([]),
          isAuthenticated ? profileApi.getFollowing().catch(() => []) : Promise.resolve([]),
          isAuthenticated ? savedLooksApi.getAll().catch(() => []) : Promise.resolve([]),
        ]);
        setWardrobe(wardrobeData);
        setFavoriteShops(shopsData);
        setFavoriteExternalShops(externalShopsData);
        setFollowingUsers(followingData);
        setSavedLooks(savedLooksData);
        // Use API data if available, otherwise use mock data
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
        setCuratedPosts(postsData.length > 0 ? postsData : MOCK_POSTS);
      } catch (error) {
        console.log('API unavailable, using mock data');
        setWardrobe([]);
        // Fallback to mock data on error
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
        setCuratedPosts(MOCK_POSTS);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [isAuthenticated, initialFittingPost]);

  // 2. Fitting Queue (items selected for generation) - Multi-select up to 5
  const [fittingQueue, setFittingQueue] = useState<Post[]>([]);
  const MAX_FITTING_ITEMS = 5;

  const handleAddToQueue = (item: Post) => {
    requireAuth(() => {
      // Toggle logic: if already selected, remove it
      if (fittingQueue.some(p => p.id === item.id)) {
        setFittingQueue(prev => prev.filter(p => p.id !== item.id));
        return;
      }

      // Check limit
      if (fittingQueue.length >= MAX_FITTING_ITEMS) {
        return; // Can't add more
      }

      // Enrich item with product info from localStorage
      let enrichedItem = { ...item };
      try {
        const productInfoStorage = JSON.parse(localStorage.getItem('wardrobe_product_info') || '{}');
        const productInfo = productInfoStorage[item.imageUrl];
        if (productInfo) {
          enrichedItem = {
            ...item,
            title: productInfo.title || item.title,
            storeUrl: productInfo.storeUrl || (item as any).storeUrl,
          } as Post;
        }
      } catch (e) {
        console.error('Failed to read product info from localStorage:', e);
      }

      // Add to queue (multi-select)
      setFittingQueue(prev => [...prev, enrichedItem]);
      setShowGeneration(true);
    });
  };

  const removeFromQueue = (id: string) => {
    setFittingQueue(prev => prev.filter(p => p.id !== id));
  };

  const [selectedFittingItem, setSelectedFittingItem] = useState<Post | null>(null);

  // Remove item from wardrobe
  const handleRemoveFromWardrobe = async (id: string) => {
    try {
      await wardrobeApi.remove(id);
      setWardrobe(prev => prev.filter(item => item.id !== id));
      // Also remove from fitting queue if selected
      setFittingQueue(prev => prev.filter(item => item.id !== id));
      if (selectedFittingItem?.id === id) {
        setSelectedFittingItem(null);
      }
    } catch (error) {
      console.error('Failed to remove from wardrobe:', error);
    }
  };

  // Slider Logic
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = wardrobe.length;

  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50 && totalSlides > 0) setCurrentSlide((prev) => (prev + 1) % totalSlides);
    if (distance < -50 && totalSlides > 0) setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    setTouchStart(0);
    setTouchEnd(0);
  };

  const handlePrevSlide = () => {
    if (totalSlides > 0) setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNextSlide = () => {
    if (totalSlides > 0) setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handleToggleGeneration = () => {
    requireAuth(() => setShowGeneration(!showGeneration));
  };

  const handleAddItemToWardrobe = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newItem: Post = {
          id: `fit-${Date.now()}`,
          imageUrl: reader.result as string,
          author: 'Моя вещь',
          likes: 0,
          isPrivate: true,
          tags: ['Virtual Fit'],
          title: 'Загруженная вещь'
        };
        setWardrobe(prev => [newItem, ...prev]);
        setCurrentSlide(0);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col w-full px-1 md:px-6 max-w-7xl mx-auto pt-16">
      {/* 1. Profile Header */}
      <div className="mb-12 mt-4 animate-in fade-in slide-in-from-top-4 duration-700">
        {isAuthenticated ? (
          <>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">@{user?.nickname || user?.name || 'user'}</h1>
            <div className="h-1 w-24 bg-black mb-4 rounded-full"></div>
            <p className="text-gray-500 max-w-md text-sm md:text-base leading-relaxed">
              Добро пожаловать в вашу цифровую гардеробную. Здесь хранятся ваши образы, история примерок и вдохновение.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">Гость</h1>
            <div className="h-1 w-24 bg-gray-300 mb-4 rounded-full"></div>
            <p className="text-gray-500 max-w-md text-sm md:text-base leading-relaxed">
              Авторизуйтесь, чтобы сохранить свои примерки и получить доступ к персональному гардеробу.
            </p>
          </>
        )}
      </div>

      {/* 2. Wardrobe Carousel - Sticky */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md py-4 -mx-1 md:-mx-6 px-1 md:px-6 shadow-sm border-b border-gray-100 transition-[top] duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-thin tracking-widest uppercase flex items-center gap-3">
            Примерочная
            <span className="text-[8px] bg-white border border-gray-200 text-black px-2 py-0.5 rounded-full align-middle tracking-widest font-bold">BETA</span>
          </h2>
        </div>

        <div className="flex gap-2 h-[150px] md:h-[200px]">
          <label className="w-[100px] md:w-[140px] flex-shrink-0 bg-gray-100 rounded-[16px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-all border-2 border-dashed relative overflow-hidden group border-gray-300">
            <input type="file" className="hidden" accept="image/*" onChange={handleAddItemToWardrobe} />
            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1 z-10 transition-colors bg-white text-gray-600 group-hover:bg-black group-hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider z-10 text-gray-500 group-hover:text-black">Добавить</span>
          </label>

          <div className="flex-1 rounded-[16px] overflow-hidden relative bg-white touch-pan-y" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            {/* Navigation Arrows */}
            {totalSlides > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevSlide(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-black hover:text-white transition-all z-20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNextSlide(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-black hover:text-white transition-all z-20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}

            <div className="flex h-full transition-transform duration-700 ease-in-out gap-1.5" style={{ transform: `translateX(-${currentSlide * (100 / (window.innerWidth < 768 ? 2 : 5))}%)` }}>
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                </div>
              ) : wardrobe.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center px-4 bg-gray-50 rounded-[16px]">
                  <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-800 mb-1">Ваша примерочная пуста</h3>
                  <p className="text-[10px] text-gray-500 max-w-xs leading-relaxed">
                    Добавьте вещи через ленту
                  </p>
                </div>
              ) : wardrobe.map(item => (
                <div key={item.id} onClick={() => handleAddToQueue(item)} className={`min-w-[48%] md:min-w-[19%] h-full relative rounded-[16px] overflow-hidden group cursor-pointer transition-all ${fittingQueue.some(p => p.id === item.id) ? 'ring-2 ring-black ring-inset' : ''}`}>
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110" />
                  <div className="absolute inset-0 group-hover:bg-black/10 transition-all duration-300"></div>

                  {/* Кнопка удаления */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromWardrobe(item.id);
                    }}
                    className="absolute top-2 left-2 bg-white/90 backdrop-blur-md text-gray-600 w-6 h-6 rounded-full flex items-center justify-center shadow-lg z-20 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>

                  {fittingQueue.some(p => p.id === item.id) && (
                    <div className="absolute top-2 right-2 bg-black text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg z-20">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 right-1 bg-white/90 backdrop-blur-xl px-2 py-1 rounded-lg text-left opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-black truncate">{item.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inline Generation Block */}
      {showGeneration && (
        <div id="generation-block" className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500" style={{ scrollMarginTop: '100px' }}>
          <div className="bg-white rounded-[40px]">
            <VirtualFitView
              embedded
              userReferences={userReferences}
              initialPost={fittingQueue.length === 1 ? fittingQueue[0] : null}
              selectedItems={fittingQueue}
              avatars={avatars}
              activeAvatarId={activeAvatarId}
              onSetActiveAvatar={onSetActiveAvatar}
            />
          </div>
        </div>
      )}

      {/* 3. Гардероб — сохранённые генерации */}
      {isAuthenticated && (
        <div className="mb-16 mt-16">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-thin tracking-widest uppercase">Гардероб</h2>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${showHistory ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-black hover:text-white'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              История {generationHistory.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full">{generationHistory.length}</span>}
            </button>
          </div>

          {/* История генераций — ВСЕ генерации из localStorage */}
          {showHistory && generationHistory.length > 0 && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {generationHistory.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setHistoryLightbox(item)}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:shadow-lg transition-all"
                  >
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    {/* Только иконка скачать */}
                    <a
                      href={item.imageUrl}
                      download={`outfit-${item.id}.png`}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showHistory && generationHistory.length === 0 && (
            <div className="mb-8 bg-gray-50 rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-500">История генераций пуста</p>
              <p className="text-xs text-gray-400 mt-1">После генерации образы появятся здесь</p>
            </div>
          )}

          {!showHistory && (
            savedLooks.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <p className="text-sm text-gray-500 mb-2">Здесь появятся ваши сохранённые образы</p>
                <p className="text-xs text-gray-400">После генерации нажмите "В гардероб", чтобы сохранить результат</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {savedLooks.slice(0, 4).map(look => (
                  <div
                    key={look.id}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 cursor-pointer"
                    onClick={() => onSelectPost(look, savedLooks)}
                  >
                    <img src={look.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-bold truncate">{look.title || 'Образ'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* 4. Избранное — магазины и подписки */}
      {isAuthenticated && (
        <div className="mb-16 mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-thin tracking-widest uppercase">Избранное</h2>
          </div>

          {favoriteExternalShops.length === 0 && followingUsers.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-500 mb-2">Здесь появятся ваши избранные магазины и подписки</p>
              <p className="text-xs text-gray-400">Добавляйте магазины через поиск, нажимая на сердце</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Избранные внешние магазины */}
              {favoriteExternalShops.map(shop => (
                <div
                  key={`ext-${shop.id}`}
                  className="group bg-white rounded-3xl p-6 border border-gray-100 hover:border-black/20 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-black truncate group-hover:text-black/80 transition-colors">
                        {shop.domain}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => shop.url && window.open(shop.url, '_blank', 'noopener,noreferrer')}
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

              {/* Подписки на пользователей */}
              {followingUsers.map(user => (
                <div
                  key={`user-${user.id}`}
                  className="group bg-white rounded-3xl p-6 border border-gray-100 hover:border-black/20 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-black truncate group-hover:text-black/80 transition-colors">
                        @{user.nickname || user.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigateToProfile(`@${user.nickname || user.name}`)}
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

              {/* Кнопка добавить */}
              <div
                onClick={() => onNavigateToFeed?.()}
                className="bg-gray-50 rounded-3xl p-6 border-2 border-dashed border-gray-200 hover:border-black/30 transition-all cursor-pointer flex items-center justify-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                  <span className="text-lg">+</span>
                </div>
                <span className="text-sm font-bold uppercase tracking-wider text-gray-400 group-hover:text-black">Найти магазины</span>
              </div>
            </div>
          )}
        </div>
      )}
      {/* History Lightbox Modal */}
      {historyLightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setHistoryLightbox(null)}
        >
          <button
            onClick={() => setHistoryLightbox(null)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div
            className="relative flex flex-col md:flex-row items-center gap-6 max-w-5xl w-full animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 max-h-[75vh]">
              <img
                src={historyLightbox.imageUrl}
                alt="Генерация"
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
              />
            </div>

            <div className="flex flex-col gap-3 w-full md:w-64 bg-white/10 backdrop-blur-md rounded-2xl p-4">
              <div className="text-center mb-2">
                <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Дата генерации</p>
                <p className="text-white font-bold">
                  {new Date(historyLightbox.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleHistoryAddToWardrobe(historyLightbox)}
                  className="flex-1 py-3 bg-white border border-black/10 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  В гардероб
                </button>
                <button
                  onClick={() => handleHistoryPublish(historyLightbox)}
                  className="flex-1 py-3 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  Опубликовать
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(historyLightbox.imageUrl);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `fitting-room-${Date.now()}.png`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch (e) { console.error("Download failed", e); }
                  }}
                  className="flex-1 py-3 bg-white border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  Скачать
                </button>
                <button
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: 'Примерочная AI',
                          text: 'Посмотрите, какой образ я создал!',
                          url: historyLightbox.imageUrl
                        });
                      } catch (e) { console.error("Share failed", e); }
                    }
                  }}
                  className="flex-1 py-3 bg-white border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  Поделиться
                </button>
              </div>
            </div>
          </div>
          <p className="absolute bottom-4 text-white/40 text-[10px] font-medium uppercase tracking-widest">
            Нажмите на фон для закрытия
          </p>
        </div>
      )}
    </div>
  );
};

export default HomeView;
