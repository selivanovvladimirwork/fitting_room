
import React, { useState, useEffect } from 'react';
import { View, Post, DigitalTwin, UserStats, Collection } from './types';
import Navigation from './components/Navigation';
import HomeView from './views/HomeView';
import AvatarView from './views/AvatarView';
import AvatarSettingsView from './views/AvatarSettingsView';
import VirtualFitView from './views/VirtualFitView';
import FeedView from './views/FeedView';
import SettingsView from './views/SettingsView';
import SubscriptionView from './views/SubscriptionView';
import PostDetailView from './views/PostDetailView';
import UserProfileView from './views/UserProfileView';

import AuthModal from './components/AuthModal';
import Notification from './components/Notification';
import { useAuth } from './context/AuthContext';
import { avatarsApi, wardrobeApi } from './services/api';

const App: React.FC = () => {
  const { requireAuth, logout, user, isAuthenticated, isNewUser } = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.FEED); // Default to Search

  // Redirect new users to Avatar Settings
  useEffect(() => {
    if (isAuthenticated && isNewUser) {
      setCurrentView(View.AVATAR_SETTINGS);
    }
  }, [isAuthenticated, isNewUser]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [currentPostList, setCurrentPostList] = useState<Post[]>([]);
  const [activeProfileUser, setActiveProfileUser] = useState<string | null>(null);
  const [fittingPost, setFittingPost] = useState<Post | null>(null);

  // Manage multiple avatars - теперь с поддержкой API
  const [avatars, setAvatars] = useState<DigitalTwin[]>([]);
  const [avatarsLoaded, setAvatarsLoaded] = useState(false);

  const [activeAvatarId, setActiveAvatarId] = useState<string | null>(() => {
    const saved = localStorage.getItem('active_avatar_id');
    return saved || null;
  });

  // Загрузка аватаров из API при авторизации
  useEffect(() => {
    const loadAvatars = async () => {
      if (isAuthenticated) {
        try {
          const apiAvatars = await avatarsApi.getAll();
          setAvatars(apiAvatars);
          if (apiAvatars.length > 0 && !activeAvatarId) {
            setActiveAvatarId(apiAvatars[0].id);
          }
        } catch (error) {
          console.error('Failed to load avatars from API:', error);
          // Fallback to localStorage
          const savedV2 = localStorage.getItem('user_avatars_v2');
          if (savedV2) setAvatars(JSON.parse(savedV2));
        }
      } else {
        // Для неавторизованных - localStorage
        const savedV2 = localStorage.getItem('user_avatars_v2');
        if (savedV2) setAvatars(JSON.parse(savedV2));
      }
      setAvatarsLoaded(true);
    };
    loadAvatars();
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeAvatarId) localStorage.setItem('active_avatar_id', activeAvatarId);
  }, [activeAvatarId]);

  const handleAddAvatar = async (avatar: DigitalTwin) => {
    setAvatars(prev => [...prev, avatar]);
    if (!activeAvatarId) setActiveAvatarId(avatar.id);

    // Сохраняем в API если авторизован и есть хотя бы одно изображение
    const validImages = avatar.referenceImages.filter(img => img && img.trim() !== '');
    if (isAuthenticated && validImages.length > 0) {
      try {
        await avatarsApi.create({
          name: avatar.name,
          referenceImages: validImages,
          stats: avatar.stats
        });
      } catch (error) {
        console.error('Failed to save avatar to API:', error);
      }
    }
  };

  const handleUpdateAvatar = async (id: string, updates: Partial<DigitalTwin>) => {
    setAvatars(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));

    if (isAuthenticated) {
      try {
        // Фильтруем пустые изображения если обновляем referenceImages
        const apiUpdates = { ...updates };
        if (apiUpdates.referenceImages) {
          apiUpdates.referenceImages = apiUpdates.referenceImages.filter(img => img && img.trim() !== '');
        }
        await avatarsApi.update(id, apiUpdates);
      } catch (error) {
        console.error('Failed to update avatar in API:', error);
      }
    }
  };

  const handleDeleteAvatar = async (id: string) => {
    setAvatars(prev => prev.filter(a => a.id !== id));
    if (activeAvatarId === id) {
      setActiveAvatarId(null);
    }

    if (isAuthenticated) {
      try {
        await avatarsApi.delete(id);
      } catch (error) {
        console.error('Failed to delete avatar from API:', error);
      }
    }
  };

  // Modals Data
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  const [postToCollect, setPostToCollect] = useState<Post | null>(null);

  const handleSavePost = (post: Post) => {
    setPostToCollect(post);
  };

  const handleAddToCollection = (collectionId: string, post: Post) => {
    setCollections(prev => prev.map(c => {
      if (c.id === collectionId) {
        // Avoid duplicates if needed, or allow
        if (c.items.some(p => p.id === post.id)) return c;
        return { ...c, items: [post, ...c.items] };
      }
      return c;
    }));
    setPostToCollect(null);
  };

  const activeAvatar = avatars.find(a => a.id === activeAvatarId);
  // Maintain backward compatibility for props expecting simple string[] for now, or update them
  const currentReferenceImages = activeAvatar ? activeAvatar.referenceImages : [];

  // Manage Collections
  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem('user_collections');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('user_collections', JSON.stringify(collections));
  }, [collections]);

  const handleCreateCollection = (name: string) => {
    const newCollection: Collection = {
      id: `col-${Date.now()}`,
      name,
      items: [],
      createdAt: Date.now()
    };
    setCollections(prev => [newCollection, ...prev]);
  };

  const handleDeleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  const handleSelectPost = (post: Post, list: Post[]) => {
    setSelectedPostId(post.id);
    setCurrentPostList(list);
    setCurrentView(View.POST_DETAIL);
  };

  const [notification, setNotification] = useState<{ message: string; actionLabel?: string; onAction?: () => void } | null>(null);

  const handleFitAction = async (post: Post) => {
    requireAuth(async () => {
      // 1. Add to API wardrobe if authenticated
      if (isAuthenticated) {
        try {
          await wardrobeApi.add({
            image_url: post.imageUrl,
            title: post.author,
          });
        } catch (error) {
          console.error('Failed to add to API wardrobe:', error);
        }
      }

      setFittingPost(post);

      // 2. Show notification
      setNotification({
        message: 'Предмет добавлен в гардероб',
        actionLabel: 'В Примерочную',
        onAction: () => setCurrentView(View.HOME)
      });
    });
  };

  const handleNavigatePost = (direction: 'next' | 'prev') => {
    if (!selectedPostId || currentPostList.length === 0) return;
    const currentIndex = currentPostList.findIndex(p => p.id === selectedPostId);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= currentPostList.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = currentPostList.length - 1;

    setSelectedPostId(currentPostList[nextIndex].id);
  };

  const handleNavigateToProfile = (username: string) => {
    if (username === '@ioniua' || username === '@me') {
      setCurrentView(View.AVATAR);
    } else {
      setActiveProfileUser(username);
      setCurrentView(View.USER_PROFILE);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case View.HOME: return (
        <HomeView
          onStart={() => requireAuth(() => setCurrentView(View.AVATAR))}
          onSelectPost={handleSelectPost}
          onFitPost={handleFitAction}
          onNavigateToProfile={handleNavigateToProfile}
          userReferences={currentReferenceImages} // Legacy support, or primary avatar
          avatars={avatars}
          activeAvatarId={activeAvatarId}
          onSetActiveAvatar={setActiveAvatarId}
          initialFittingPost={fittingPost}
          onSavePost={handleSavePost}
        />
      );
      case View.AVATAR: return (
        <AvatarView
          onNavigateSubscription={() => setCurrentView(View.SUBSCRIPTION)}
          onSelectPost={handleSelectPost}
          onFitPost={handleFitAction}
          onNavigateToFittingRoom={() => setCurrentView(View.HOME)}
          onLogout={() => {
            logout();
            setCurrentView(View.FEED);
          }}
          onNavigateToProfile={handleNavigateToProfile}
          avatars={avatars}
          activeAvatarId={activeAvatarId}
          onAddAvatar={handleAddAvatar}
          onUpdateAvatar={handleUpdateAvatar}
          onDeleteAvatar={handleDeleteAvatar}
          onSetActiveAvatar={setActiveAvatarId}
          collections={collections}
          onOpenCreateCollection={() => setShowCreateCollectionModal(true)}
          onDeleteCollection={handleDeleteCollection}
          onSavePost={handleSavePost}
        />
      );
      case View.AVATAR_SETTINGS: return (
        <AvatarSettingsView
          onBack={() => setCurrentView(View.AVATAR)}
          avatars={avatars}
          activeAvatarId={activeAvatarId}
          onAddAvatar={handleAddAvatar}
          onUpdateAvatar={handleUpdateAvatar}
          onDeleteAvatar={handleDeleteAvatar}
          onSetActiveAvatar={setActiveAvatarId}
        />
      );
      case View.VIRTUAL_FIT: return (
        <VirtualFitView
          initialPost={fittingPost}
          avatars={avatars}
          activeAvatarId={activeAvatarId}
          onSetActiveAvatar={setActiveAvatarId} // For selection during generation
          onNavigateToProfile={handleNavigateToProfile}
          onSavePost={handleSavePost}
        />
      );
      case View.FEED: return (
        <FeedView
          onSelectPost={handleSelectPost}
          onFitPost={handleFitAction}
          onNavigateToProfile={handleNavigateToProfile}
        />
      );
      case View.SETTINGS: return <SettingsView onBack={() => setCurrentView(View.AVATAR)} />;
      case View.SUBSCRIPTION: return <SubscriptionView onBack={() => setCurrentView(View.AVATAR)} />;
      case View.USER_PROFILE: return (
        <UserProfileView
          username={activeProfileUser || 'User'}
          onBack={() => setCurrentView(View.HOME)}
          onSelectPost={handleSelectPost}
          onFitPost={handleFitAction}
          onNavigateToProfile={handleNavigateToProfile}
        />
      );
      case View.POST_DETAIL:
        const post = currentPostList.find(p => p.id === selectedPostId);
        return post ? (
          <PostDetailView
            post={post}
            onBack={() => setCurrentView(View.FEED)}
            onNavigate={handleNavigatePost}
            onSelectPost={handleSelectPost}
            onNavigateToProfile={handleNavigateToProfile}
            onFit={handleFitAction}
          />
        ) : <FeedView onSelectPost={handleSelectPost} onFitPost={handleFitAction} onNavigateToProfile={handleNavigateToProfile} />;
      default: return <FeedView onSelectPost={handleSelectPost} onFitPost={handleFitAction} onNavigateToProfile={handleNavigateToProfile} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden selection:bg-black selection:text-white">
      <AuthModal />
      <Navigation currentView={currentView} setView={setCurrentView} />
      <main className="flex-grow pt-24 pb-12 px-1 md:px-4 w-full">
        {renderView()}
      </main>

      {/* Liquid Glass Tab Bar (Mobile) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 md:hidden z-50">
        <div className="liquid-glass rounded-full px-6 py-3 flex gap-6 items-center shadow-2xl border-white/80">
          {/* Search (Feed) */}
          <button onClick={() => setCurrentView(View.FEED)} className={`transition-all ${currentView === View.FEED ? 'text-black scale-110' : 'text-gray-400'}`}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>

          {/* Fitting Room (Home) */}
          <button onClick={() => setCurrentView(View.HOME)} className={`transition-all ${currentView === View.HOME ? 'text-black scale-110' : 'text-gray-400'}`}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </button>

          {/* Profile (Avatar) */}
          <button onClick={() => requireAuth(() => setCurrentView(View.AVATAR))} className={`transition-all ${currentView === View.AVATAR || currentView === View.SETTINGS || currentView === View.SUBSCRIPTION ? 'text-black scale-110' : 'text-gray-400'}`}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </button>
        </div>
      </div>
      {/* Create Collection Modal */}
      {showCreateCollectionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6 text-center">Новая группа</h3>
            <input
              autoFocus
              type="text"
              placeholder="Название..."
              className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold mb-6 focus:ring-2 focus:ring-black transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateCollection((e.target as HTMLInputElement).value);
                  setShowCreateCollectionModal(false);
                }
              }}
              id="new-collection-name"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateCollectionModal(false)}
                className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('new-collection-name') as HTMLInputElement;
                  if (input?.value) {
                    handleCreateCollection(input.value);
                    setShowCreateCollectionModal(false);
                  }
                }}
                className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-black text-white hover:bg-gray-900 transition-colors"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add To Collection Modal */}
      {postToCollect && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 h-[500px] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Сохранить в...</h3>
              <button onClick={() => setPostToCollect(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-2 mb-4 scrollbar-hide">
              <button
                onClick={() => {
                  setShowCreateCollectionModal(true);
                  // Keep postToCollect active so we can add to it after creation? 
                  // Currently simplistic: Create, then user has to click save again or I handle logic.
                  // User flow: Click Create -> Create -> Modal closes -> Add to Collection Modal still open?
                  // Yes, showCreateCollectionModal stacks on top.
                }}
                className="w-full p-4 rounded-[24px] border-2 border-dashed border-gray-200 flex items-center gap-4 hover:border-black hover:bg-gray-50 transition-all group shrink-0"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white text-gray-400 group-hover:text-black transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                </div>
                <span className="font-bold text-sm text-gray-400 group-hover:text-black">Новая группа</span>
              </button>

              {collections.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleAddToCollection(c.id, postToCollect)}
                  className="w-full p-4 rounded-[24px] bg-gray-50 flex items-center gap-4 hover:bg-black hover:text-white transition-all group shrink-0"
                >
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-100 text-black">
                    {c.items.length > 0 && c.items[0].imageUrl ? (
                      <img src={c.items[0].imageUrl} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-sm line-clamp-1">{c.name}</h4>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">{c.items.length} фото</p>
                  </div>
                  {c.items.some(p => p.id === postToCollect.id) && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {notification && (
        <Notification
          message={notification.message}
          actionLabel={notification.actionLabel}
          onAction={notification.onAction}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default App;
