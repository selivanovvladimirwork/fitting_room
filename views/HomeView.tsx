import React, { useState, useMemo, useEffect } from 'react';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { DigitalTwin } from '../types';
import VirtualFitView from './VirtualFitView';
import { postsApi, wardrobeApi } from '../services/api';

interface HomeViewProps {
  onStart: () => void;
  onSelectPost: (post: Post, list: Post[]) => void;
  onFitPost: (post: Post) => void;
  onNavigateToProfile: (username: string) => void;
  avatars: DigitalTwin[];
  activeAvatarId: string | null;
  onSetActiveAvatar: (id: string) => void;
  onSavePost?: (post: Post) => void;
}

// Mock data removed - all posts come from API

const HomeView: React.FC<HomeViewProps & { userReferences?: string[], initialFittingPost?: Post | null }> = ({ onStart, onSelectPost, onFitPost, onNavigateToProfile, userReferences, initialFittingPost, avatars, activeAvatarId, onSetActiveAvatar, onSavePost }) => {
  const { isAuthenticated, requireAuth, user } = useAuth();
  const [showGeneration, setShowGeneration] = useState(true);
  const [curatedPosts, setCuratedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        const [wardrobeData, postsData] = await Promise.all([
          wardrobeApi.getAll().catch(() => []),
          postsApi.getAll().catch(() => []),
        ]);
        setWardrobe(wardrobeData);
        setCuratedPosts(postsData); // Только данные из API
      } catch (error) {
        console.log('API unavailable');
        setWardrobe([]);
        setCuratedPosts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. Fitting Queue (items selected for generation)
  const [fittingQueue, setFittingQueue] = useState<Post[]>([]);

  const handleAddToQueue = (item: Post) => {
    requireAuth(() => {
      // Toggle logic: if already selected, deselect it
      if (fittingQueue.some(p => p.id === item.id)) {
        setFittingQueue([]);
        setSelectedFittingItem(null);
        // Do not hide generation block
        return;
      }

      // Single selection: replace entire queue with new item
      setFittingQueue([item]);
      setSelectedFittingItem(item);
      setShowGeneration(true);
    });
  };

  const removeFromQueue = (id: string) => {
    setFittingQueue([]);
    setSelectedFittingItem(null);
    // Do not hide generation block
  };

  const [selectedFittingItem, setSelectedFittingItem] = useState<Post | null>(null);

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

      {/* 2. Wardrobe Carousel */}
      <div className="mb-24">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-4xl md:text-5xl font-thin tracking-widest uppercase flex items-center gap-4">
            Примерочная
            <span className="text-[10px] bg-white border border-gray-200 text-black px-3 py-1 rounded-full align-middle transform -translate-y-1 tracking-widest font-bold">BETA</span>
          </h2>
        </div>

        <div className="flex gap-4 h-[300px] md:h-[400px]">
          <label className="w-[140px] md:w-[220px] flex-shrink-0 bg-gray-100 rounded-[24px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-all border-2 border-dashed relative overflow-hidden group border-gray-300">
            <input type="file" className="hidden" accept="image/*" onChange={handleAddItemToWardrobe} />
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 z-10 transition-colors bg-white text-gray-600 group-hover:bg-black group-hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider z-10 text-gray-500 group-hover:text-black">Добавить</span>
          </label>

          <div className="flex-1 rounded-[24px] overflow-hidden relative bg-white touch-pan-y" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            {/* Navigation Arrows */}
            {totalSlides > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevSlide(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-black hover:text-white transition-all z-20"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNextSlide(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-black hover:text-white transition-all z-20"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}

            <div className="flex h-full transition-transform duration-700 ease-in-out gap-2" style={{ transform: `translateX(-${currentSlide * (100 / (window.innerWidth < 768 ? 1.2 : 3))}%)` }}>
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                </div>
              ) : wardrobe.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center px-8 bg-gray-50 rounded-[24px]">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Ваш гардероб пуст</h3>
                  <p className="text-sm text-gray-500 max-w-md leading-relaxed">
                    Добавьте вещи через кнопку <strong>«+»</strong> слева или нажмите на любой образ в ленте и выберите <strong>«Примерить»</strong>
                  </p>
                </div>
              ) : wardrobe.map(item => (
                <div key={item.id} onClick={() => handleAddToQueue(item)} className={`min-w-[80%] md:min-w-[32%] h-full relative rounded-[24px] md:rounded-[32px] overflow-hidden group cursor-pointer transition-all ${fittingQueue.some(p => p.id === item.id) ? 'ring-4 ring-black ring-inset' : ''}`}>
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover absolute inset-0 md:bg-center transition-transform duration-700 ease-out group-hover:scale-110" />
                  <div className="absolute inset-0 group-hover:bg-black/10 transition-all duration-500"></div>
                  {fittingQueue.some(p => p.id === item.id) && (
                    <div className="absolute top-4 right-4 bg-black text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg z-20">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl px-6 py-4 rounded-[20px] text-left opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out delay-75">
                    <p className="text-[14px] font-black uppercase tracking-[0.1em] text-black mb-1">{item.author}</p>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">{item.title}</p>
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
              initialPost={selectedFittingItem}
              avatars={avatars}
              activeAvatarId={activeAvatarId}
              onSetActiveAvatar={onSetActiveAvatar}
            />
          </div>
        </div>
      )}

      {/* 4. Recommendations */}
      <div className="mb-20">
        <h2 className="text-4xl md:text-5xl font-thin tracking-widest uppercase mb-10 border-b border-gray-100 pb-4">Рекомендации</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 w-full">
            {curatedPosts.map((post) => (
              <div key={post.id}>
                <PostCard
                  post={post}
                  onClick={(p) => onFitPost(p)}
                  onFitClick={(e, p) => onFitPost(p)}
                  onAuthorClick={onNavigateToProfile}
                  onSaveClick={(p) => onSavePost && onSavePost(p)}
                  hideActions={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeView;
