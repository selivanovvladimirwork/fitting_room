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

// Fallback mock data
const MOCK_WARDROBE: Post[] = [
  { id: 'fit-1', imageUrl: '/mock/div_1_silk_dress_asian_1767457702563.png', author: 'Gucci', title: 'Шелковое вечернее платье', likes: 0, isPrivate: false, tags: ['Virtual Fit'] },
  { id: 'fit-2', imageUrl: '/mock/div_2_denim_black_male_1767457717602.png', author: "Levi's", title: 'Винтажная джинсовая куртка', likes: 0, isPrivate: false, tags: ['Virtual Fit'] },
  { id: 'fit-3', imageUrl: '/mock/div_3_trench_redhead_1767457730112.png', author: 'Burberry', title: 'Классический тренч', likes: 0, isPrivate: false, tags: ['Virtual Fit'] },
  { id: 'fit-4', imageUrl: '/mock/div_4_yoga_latina_1767457754254.png', author: 'Alo Yoga', title: 'Спортивный костюм', likes: 0, isPrivate: false, tags: ['Virtual Fit'] },
  { id: 'fit-5', imageUrl: '/mock/div_5_business_white_male_1767457767827.png', author: 'Hugo Boss', title: 'Деловой костюм', likes: 0, isPrivate: false, tags: ['Virtual Fit'] },
  { id: 'fit-6', imageUrl: '/mock/div_6_boho_black_female_1767457782503.png', author: 'Free People', title: 'Платье в стиле Бохо', likes: 0, isPrivate: false, tags: ['Virtual Fit'] },
];

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

const HomeView: React.FC<HomeViewProps & { userReferences?: string[], initialFittingPost?: Post | null }> = ({ onStart, onSelectPost, onFitPost, onNavigateToProfile, userReferences, initialFittingPost, avatars, activeAvatarId, onSetActiveAvatar, onSavePost }) => {
  const { isAuthenticated, requireAuth } = useAuth();
  const [showGeneration, setShowGeneration] = useState(false);
  const [curatedPosts, setCuratedPosts] = useState<Post[]>(MOCK_POSTS);

  // Handle external initial fitting post
  useEffect(() => {
    if (initialFittingPost) {
      setSelectedFittingItem(initialFittingPost);
      setShowGeneration(true);
      setTimeout(() => {
        const generationBlock = document.getElementById('generation-block');
        if (generationBlock) {
          generationBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [initialFittingPost]);

  // 1. Dynamic Wardrobe - load from API with fallback
  const [wardrobe, setWardrobe] = useState<Post[]>(MOCK_WARDROBE);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [wardrobeData, postsData] = await Promise.all([
          wardrobeApi.getAll().catch(() => []),
          postsApi.getAll().catch(() => []),
        ]);
        if (wardrobeData.length > 0) setWardrobe(wardrobeData);
        if (postsData.length > 0) setCuratedPosts(postsData);
      } catch (error) {
        console.log('API unavailable, using mock data');
      }
    };
    loadData();
  }, []);

  // 2. Fitting Queue (items selected for generation)
  const [fittingQueue, setFittingQueue] = useState<Post[]>([]);

  const handleAddToQueue = (item: Post) => {
    requireAuth(() => {
      if (fittingQueue.some(p => p.id === item.id)) return;
      setFittingQueue(prev => [...prev, item]);
      if (!selectedFittingItem) {
        setSelectedFittingItem(item);
        setShowGeneration(true);
      }
    });
  };

  const removeFromQueue = (id: string) => {
    setFittingQueue(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (selectedFittingItem?.id === id) {
        setSelectedFittingItem(filtered.length > 0 ? filtered[0] : null);
      }
      return filtered;
    });
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

  useEffect(() => {
    if (totalSlides === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 3000);
    return () => clearInterval(timer);
  }, [totalSlides]);

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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">@ioniua</h1>
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
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium uppercase tracking-widest text-gray-800 flex items-center gap-3">
            Гардероб
            <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full shadow-lg">BETA</span>
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
            <div className="flex h-full transition-transform duration-700 ease-in-out gap-2" style={{ transform: `translateX(-${currentSlide * (100 / (window.innerWidth < 768 ? 1.2 : 3))}%)` }}>
              {wardrobe.map(item => (
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

      {/* 3. Fitting Queue Section */}
      {fittingQueue.length > 0 && (
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium uppercase tracking-widest text-gray-800 flex items-center gap-3">
              Выбрано для примерки
              <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full">{fittingQueue.length}</span>
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {fittingQueue.map(item => (
              <div key={item.id} className={`relative w-24 md:w-32 flex-shrink-0 aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group border-2 transition-all ${selectedFittingItem?.id === item.id ? 'border-black scale-105 shadow-xl' : 'border-transparent'}`} onClick={() => setSelectedFittingItem(item)}>
                <img src={item.imageUrl} className="w-full h-full object-cover" />
                <div className={`absolute inset-0 transition-opacity ${selectedFittingItem?.id === item.id ? 'bg-black/0' : 'bg-black/20 group-hover:bg-black/0'}`} />
                <button onClick={(e) => { e.stopPropagation(); removeFromQueue(item.id); }} className="absolute top-2 right-2 w-6 h-6 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
      <div className="mb-12">
        <h2 className="text-xl font-medium uppercase tracking-widest text-gray-800 mb-8 border-b border-gray-100 pb-4">Рекомендации</h2>
        <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4 space-y-2 md:space-y-4 w-full">
          {curatedPosts.map((post) => (
            <div key={post.id} className="break-inside-avoid mb-4">
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
      </div>
    </div>
  );
};

export default HomeView;
