
import React, { useState, useEffect, useCallback } from 'react';
import { View, Post, DigitalTwin, UserStats } from './types';
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
import { avatarsApi, wardrobeApi, postsApi } from './services/api';

// Route parsing helper
const parseRoute = (): { view: View; postId?: string; username?: string } => {
  const path = window.location.pathname;

  // /post/ID
  if (path.startsWith('/post/')) {
    const postId = path.replace('/post/', '');
    return { view: View.POST_DETAIL, postId };
  }

  // /@username
  if (path.startsWith('/@')) {
    const username = path.replace('/@', '');
    return { view: View.USER_PROFILE, username };
  }

  // Static routes
  const routes: Record<string, View> = {
    '/': View.FEED,
    '/home': View.HOME,
    '/avatar': View.AVATAR,
    '/settings': View.SETTINGS,
    '/subscription': View.SUBSCRIPTION,
    '/avatar-settings': View.AVATAR_SETTINGS,
  };

  return { view: routes[path] || View.FEED };
};

const App: React.FC = () => {
  const { requireAuth, logout, user, isAuthenticated, isNewUser } = useAuth();

  // Parse initial route
  const initialRoute = parseRoute();
  const [currentView, setCurrentView] = useState<View>(initialRoute.view);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [currentPostList, setCurrentPostList] = useState<Post[]>([]);
  const [activeProfileUser, setActiveProfileUser] = useState<string | null>(initialRoute.username || null);
  const [fittingPost, setFittingPost] = useState<Post | null>(null);
  const [routePostId, setRoutePostId] = useState<string | null>(initialRoute.postId || null);

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

  const handleSavePost = (post: Post) => {
    // Placeholder for future save functionality
  };

  const activeAvatar = avatars.find(a => a.id === activeAvatarId);
  // Maintain backward compatibility for props expecting simple string[] for now
  const currentReferenceImages = activeAvatar ? activeAvatar.referenceImages : [];

  // Redirect new users to Avatar Settings
  useEffect(() => {
    if (isAuthenticated && isNewUser) {
      setCurrentView(View.AVATAR_SETTINGS);
    }
  }, [isAuthenticated, isNewUser]);

  // Load post from URL if routePostId is set
  useEffect(() => {
    const loadPostFromRoute = async () => {
      if (routePostId && !selectedPost) {
        try {
          const post = await postsApi.getOne(routePostId);
          if (post) {
            setSelectedPost(post);
            setCurrentView(View.POST_DETAIL);
          }
        } catch (error) {
          console.error('Failed to load post from URL:', error);
          setCurrentView(View.FEED);
        }
        setRoutePostId(null);
      }
    };
    loadPostFromRoute();
  }, [routePostId, selectedPost]);

  // Update URL when view changes
  useEffect(() => {
    window.scrollTo(0, 0);

    const routeMap: Partial<Record<View, string>> = {
      [View.FEED]: '/',
      [View.HOME]: '/home',
      [View.AVATAR]: '/avatar',
      [View.SETTINGS]: '/settings',
      [View.SUBSCRIPTION]: '/subscription',
      [View.AVATAR_SETTINGS]: '/avatar-settings',
    };

    let newPath = routeMap[currentView] || '/';

    if (currentView === View.POST_DETAIL && selectedPost) {
      newPath = `/post/${selectedPost.id}`;
    } else if (currentView === View.USER_PROFILE && activeProfileUser) {
      newPath = `/@${activeProfileUser.replace('@', '')}`;
    }

    // Only update if path changed
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  }, [currentView, selectedPost, activeProfileUser]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const route = parseRoute();
      setCurrentView(route.view);
      if (route.postId) {
        setRoutePostId(route.postId);
      }
      if (route.username) {
        setActiveProfileUser(route.username);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectPost = (post: Post, list: Post[]) => {
    setSelectedPost(post);
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
    if (!selectedPost || currentPostList.length === 0) return;
    const currentIndex = currentPostList.findIndex(p => p.id === selectedPost.id);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= currentPostList.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = currentPostList.length - 1;

    setSelectedPost(currentPostList[nextIndex]);
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
        if (!selectedPost) {
          // No post selected - redirect to feed
          setTimeout(() => setCurrentView(View.FEED), 0);
          return <FeedView onSelectPost={handleSelectPost} onFitPost={handleFitAction} onNavigateToProfile={handleNavigateToProfile} />;
        }
        return (
          <PostDetailView
            post={selectedPost}
            onBack={() => setCurrentView(View.FEED)}
            onNavigate={handleNavigatePost}
            onSelectPost={handleSelectPost}
            onNavigateToProfile={handleNavigateToProfile}
            onFit={handleFitAction}
          />
        );
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
