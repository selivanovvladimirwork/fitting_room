import React, { useState } from 'react';
import { Post, DigitalTwin, PostGroup } from '../types';
import PostCard from '../components/PostCard';
import SettingsView from './SettingsView';
import AvatarSettingsView from './AvatarSettingsView';
import { authApi, postGroupsApi, profileApi } from '../services/api';

interface AvatarViewProps {
  onNavigateSubscription: () => void;
  onSelectPost: (post: Post, list: Post[]) => void;
  onFitPost: (post: Post) => void;
  onNavigateToFittingRoom: () => void;
  onLogout: () => void;
  onNavigateToProfile: (username: string) => void;
  avatars: DigitalTwin[];
  activeAvatarId: string | null;
  onAddAvatar: (avatar: DigitalTwin) => void;
  onUpdateAvatar: (id: string, updates: Partial<DigitalTwin>) => void;
  onDeleteAvatar: (id: string) => void;
  onSetActiveAvatar: (id: string) => void;
  onSavePost?: (post: Post) => void;
}

import { useAuth } from '../context/AuthContext';

const AvatarView: React.FC<AvatarViewProps> = ({ onNavigateSubscription, onNavigateToFittingRoom, onSelectPost, onFitPost, onLogout, onNavigateToProfile, avatars, activeAvatarId, onAddAvatar, onUpdateAvatar, onDeleteAvatar, onSetActiveAvatar, onSavePost }) => {
  const { requireAuth, user, refreshUser, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'settings' | 'edit_avatar'>('profile');
  const [activeTab, setActiveTab] = useState<'following' | 'saved' | 'liked' | 'my_posts'>('my_posts');

  // Bio Editing State
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || '');

  // Profile Data State (from API)
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabDataLoaded, setTabDataLoaded] = useState<Record<string, boolean>>({});

  // Post Groups State (Instagram Highlights style)
  const [postGroups, setPostGroups] = useState<PostGroup[]>([]);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [pendingGroupPosts, setPendingGroupPosts] = useState<Post[]>([]);
  const [groupName, setGroupName] = useState('');

  // Drag and Drop State (simple drag, no long-press)
  const [draggedPost, setDraggedPost] = useState<Post | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Group Hint State
  const [showHint, setShowHint] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('group_hint_seen');
    }
    return false;
  });

  const handleDismissHint = () => {
    setShowHint(false);
    localStorage.setItem('group_hint_seen', 'true');
  };

  // Load groups from API on mount
  React.useEffect(() => {
    const loadGroups = async () => {
      if (isAuthenticated) {
        try {
          const apiGroups = await postGroupsApi.getAll();
          setPostGroups(apiGroups);
        } catch (error) {
          console.error('Failed to load groups from API:', error);
          // Fallback to localStorage
          const saved = localStorage.getItem('user_post_groups');
          if (saved) setPostGroups(JSON.parse(saved));
        }
      } else {
        // For non-authenticated - localStorage
        const saved = localStorage.getItem('user_post_groups');
        if (saved) setPostGroups(JSON.parse(saved));
      }
      setGroupsLoaded(true);
    };
    loadGroups();
  }, [isAuthenticated]);

  // Persist post groups to localStorage (and sync with API for auth users)
  React.useEffect(() => {
    if (!groupsLoaded) return;

    localStorage.setItem('user_post_groups', JSON.stringify(postGroups));

    // Sync to API if authenticated
    if (isAuthenticated && postGroups.length >= 0) {
      postGroupsApi.sync(postGroups).catch(err => console.error('Sync error:', err));
    }
  }, [postGroups, isAuthenticated, groupsLoaded]);

  // Update bioText when user changes (e.g. after save)
  React.useEffect(() => {
    if (user?.bio) setBioText(user.bio);
  }, [user?.bio]);

  // Load tab data from API
  React.useEffect(() => {
    if (!isAuthenticated) return;
    if (tabDataLoaded[activeTab]) return; // Already loaded

    const loadTabData = async () => {
      setTabLoading(true);
      try {
        switch (activeTab) {
          case 'my_posts':
            const posts = await profileApi.getMyPosts();
            setMyPosts(posts.map((p: any) => ({
              id: String(p.id),
              imageUrl: p.image_url,
              author: p.author_name || user?.nickname || '@user',
              likes: p.likes || 0,
              isPrivate: p.is_private || false,
              tags: p.tags || []
            })));
            break;
          case 'following':
            const followingData = await profileApi.getFollowing();
            setFollowing(followingData);
            break;
          case 'saved':
            const saved = await profileApi.getSavedPosts();
            setSavedPosts(saved.map((p: any) => ({
              id: String(p.id),
              imageUrl: p.image_url,
              author: p.author_name || '@unknown',
              likes: p.likes || 0,
              isPrivate: p.is_private || false,
              tags: p.tags || []
            })));
            break;
          case 'liked':
            const liked = await profileApi.getLikedPosts();
            setLikedPosts(liked.map((p: any) => ({
              id: String(p.id),
              imageUrl: p.image_url,
              author: p.author_name || '@unknown',
              likes: p.likes || 0,
              isPrivate: p.is_private || false,
              tags: p.tags || []
            })));
            break;
        }
        setTabDataLoaded(prev => ({ ...prev, [activeTab]: true }));
      } catch (error) {
        console.error(`Failed to load ${activeTab}:`, error);
      } finally {
        setTabLoading(false);
      }
    };

    loadTabData();
  }, [activeTab, isAuthenticated, tabDataLoaded, user?.nickname]);

  const handleSaveBio = async () => {
    if (bioText === user?.bio) {
      setIsEditingBio(false);
      return;
    }

    setIsSavingBio(true);
    try {
      await authApi.updateProfile({ bio: bioText });
      await refreshUser();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingBio(false);
    }
    setIsEditingBio(false);
  };

  // Group Management
  const handleCreateGroup = () => {
    if (!groupName.trim() || pendingGroupPosts.length === 0) return;
    const newGroup: PostGroup = {
      id: `group-${Date.now()}`,
      name: groupName.trim(),
      posts: pendingGroupPosts,
      createdAt: Date.now()
    };
    setPostGroups(prev => [newGroup, ...prev]);
    setShowGroupModal(false);
    setGroupName('');
    setPendingGroupPosts([]);

    // Auto-dismiss hint if successful
    if (showHint) {
      setShowHint(false);
      localStorage.setItem('group_hint_seen', 'true');
    }
  };

  const handleAddToGroup = (groupId: string, post: Post) => {
    setPostGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        if (g.posts.some(p => p.id === post.id)) return g;
        return { ...g, posts: [...g.posts, post] };
      }
      return g;
    }));

    // Auto-dismiss hint if successful
    if (showHint) {
      setShowHint(false);
      localStorage.setItem('group_hint_seen', 'true');
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    setPostGroups(prev => prev.filter(g => g.id !== groupId));
    if (activeGroup === groupId) setActiveGroup(null);
  };

  const handleRemoveFromGroup = (groupId: string, postId: string) => {
    setPostGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const newPosts = g.posts.filter(p => p.id !== postId);
        if (newPosts.length === 0) return null as any;
        return { ...g, posts: newPosts };
      }
      return g;
    }).filter(Boolean));
  };

  // Simple Drag and Drop handlers (without long-press)
  const handleDragStart = (post: Post, e: React.DragEvent) => {
    setDraggedPost(post);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', post.id);
  };

  const handleDragEnd = () => {
    setDraggedPost(null);
    setDropTargetId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetPost?: Post, targetGroupId?: string) => {
    if (!draggedPost) return;

    if (targetGroupId) {
      // Adding to existing group
      handleAddToGroup(targetGroupId, draggedPost);
    } else if (targetPost && targetPost.id !== draggedPost.id) {
      // Creating new group from two posts
      setPendingGroupPosts([draggedPost, targetPost]);
      setShowGroupModal(true);
    }

    setDraggedPost(null);
    setDropTargetId(null);
  };

  const MOCK_IMAGES = [
    '/mock/mock_fashion_1_linen_1767375467855.png',
    '/mock/mock_fashion_2_gown_1767375483429.png',
    '/mock/mock_fashion_3_hoodie_1767375497361.png',
    '/mock/mock_fashion_4_floral_1767375511416.png',
    '/mock/mock_fashion_5_blazer_1767375533683.png',
    '/mock/mock_fashion_6_denim_1767375546890.png',
    '/mock/mock_fashion_7_yoga_1767375561414.png',
    '/mock/mock_fashion_8_trench_1767375574933.png',
    '/mock/mock_fashion_9_boho_1767375588800.png',
    '/mock/mock_fashion_10_knit_1767375602151.png',
    '/mock/uploaded_image_0_1767382693233.png',
    '/mock/uploaded_image_1_1767382693233.png',
    '/mock/uploaded_image_2_1767382693233.png',
    '/mock/uploaded_image_3_1767382693233.png',
    '/mock/uploaded_image_4_1767382693233.png',
    '/mock/mock_history_1_coat_tall_1767381603039.png',
    '/mock/mock_history_2_shoes_sq_1767381617174.png',
    '/mock/mock_history_3_dress_tall_1767381630936.png'
  ];

  // Get current avatar to display in profile header
  const activeAvatar = avatars.find(a => a.id === activeAvatarId);
  const currentAvatar = activeAvatar && activeAvatar.referenceImages.length > 0 ? activeAvatar.referenceImages[0] : '/mock/mock_avatar_full_001.jpg';

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 pt-16">

      {/* Profile Header Block */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-8">
        <div className="flex items-end gap-6">
          <div className="mb-2 flex flex-col">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">
              @{user?.nickname || user?.name || 'USER'}
            </h1>

            {/* User Bio */}
            <div className="relative group max-w-md mt-2">
              {isEditingBio ? (
                <div className="animate-in fade-in zoom-in duration-200">
                  <textarea
                    autoFocus
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value.slice(0, 120))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-600 focus:ring-2 focus:ring-black outline-none resize-none"
                    rows={3}
                    placeholder="Расскажите о себе (до 120 символов)..."
                  />
                  <div className="flex justify-between items-center mt-2 px-1">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveBio}
                        disabled={isSavingBio}
                        className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {isSavingBio && (
                          <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {isSavingBio ? 'Сохраняю...' : 'Сохранить'}
                      </button>
                      <button
                        type="button"
                        disabled={isSavingBio}
                        onClick={() => {
                          setBioText(user?.bio || '');
                          setIsEditingBio(false);
                        }}
                        className="px-3 py-1 bg-white border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Отменить
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">{bioText.length}/120</span>
                  </div>
                </div>
              ) : (
                <div onClick={() => setIsEditingBio(true)} className="cursor-pointer group/bio">
                  <p className={`text-sm md:text-base leading-relaxed ${user?.bio ? 'text-gray-500' : 'text-gray-300 italic'}`}>
                    {user?.bio || 'Добавить описание профиля...'}
                  </p>
                  <div className="absolute -right-6 top-0 opacity-0 group-hover/bio:opacity-100 transition-opacity p-1 text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { setActiveSection('profile'); setActiveTab('my_posts'); }}
            className={`px-6 py-3 rounded-full font-bold uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeSection === 'profile' ? 'bg-black text-white shadow-lg' : 'bg-gray-100 hover:bg-black hover:text-white'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Профиль
          </button>
          <button
            onClick={() => setActiveSection('settings')}
            className={`px-6 py-3 rounded-full font-bold uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeSection === 'settings' ? 'bg-black text-white shadow-lg' : 'bg-gray-100 hover:bg-black hover:text-white'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Настройки
          </button>
          <button
            onClick={() => setActiveSection('edit_avatar')}
            className={`px-6 py-3 rounded-full font-bold uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeSection === 'edit_avatar' ? 'bg-black text-white shadow-lg' : 'bg-gray-100 hover:bg-black hover:text-white'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Аватары
          </button>
          <button
            onClick={onLogout}
            className="px-6 py-3 rounded-full bg-gray-50 text-red-400 font-bold uppercase tracking-widest text-[10px] hover:bg-red-50 hover:text-red-500 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Выйти
          </button>
        </div>
      </div>

      {activeSection === 'profile' && (
        <>
          {/* Highlights Section (Instagram-style groups) */}
          {postGroups.length > 0 && (
            <div className="mb-6">
              <div className="flex gap-4 overflow-x-auto p-4 scrollbar-hide -mx-4 px-4 md:px-0">
                {postGroups.map(group => (
                  <div
                    key={group.id}
                    onClick={() => setActiveGroup(activeGroup === group.id ? null : group.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => { e.preventDefault(); handleDrop(undefined, group.id); }}
                    className={`flex flex-col items-center gap-1 shrink-0 transition-all cursor-pointer outline-none ${activeGroup === group.id ? 'scale-105' : ''} ${draggedPost ? 'ring-2 ring-dashed ring-gray-400' : ''}`}
                  >
                    <div className={`w-16 h-16 md:w-[70px] md:h-[70px] rounded-full p-0.5 ${activeGroup === group.id ? 'bg-black' : 'bg-gray-200'}`}>
                      <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                        <img
                          src={group.posts[0]?.imageUrl || '/mock/mock_fashion_1_linen_1767375467855.png'}
                          alt={group.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 max-w-[70px] truncate">
                      {group.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Group Content */}
          {activeGroup && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black uppercase tracking-tight">
                  {postGroups.find(g => g.id === activeGroup)?.name}
                </h3>
                <button
                  onClick={() => handleDeleteGroup(activeGroup)}
                  className="px-6 py-3 rounded-full bg-gray-50 text-red-400 font-bold uppercase tracking-widest text-[10px] hover:bg-red-50 hover:text-red-500 transition-all flex items-center gap-2"
                >
                  Удалить группу
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                {postGroups.find(g => g.id === activeGroup)?.posts.map((post, i) => (
                  <div key={post.id} className="relative group/item">
                    <PostCard
                      post={post}
                      onClick={(p) => onSelectPost(p, postGroups.find(g => g.id === activeGroup)?.posts || [])}
                      onFitClick={(e, p) => { if (onFitPost) onFitPost(p); }}
                      hideActions={true}
                    />
                    <button
                      onClick={() => handleRemoveFromGroup(activeGroup, post.id)}
                      className="absolute top-0 right-2 w-10 h-10 flex items-center justify-center text-white opacity-0 group-hover/item:opacity-100 transition-all hover:scale-125 active:scale-90 z-50"
                      title="Убрать из группы"
                    >
                      <svg className="w-7 h-7 drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Chips */}
          <div className="border-b border-gray-100 mb-8 overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
              {['my_posts', 'following', 'saved', 'liked'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                  {tab === 'my_posts' && 'Публикации'}
                  {tab === 'following' && 'Подписки'}
                  {tab === 'saved' && 'Избранное'}
                  {tab === 'liked' && 'Лайки'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in duration-500 min-h-[400px]">



            {activeTab === 'my_posts' && (
              <>
                {/* Hint for grouping - Only shown if not seen before */}
                {showHint && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-4 relative group">
                    <div className="p-2 bg-white rounded-full shadow-sm text-black">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-1">Создание коллекций</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Перетащите одно фото на другое, чтобы объединить их в группу.
                      </p>
                    </div>
                    <button
                      onClick={handleDismissHint}
                      className="text-gray-400 hover:text-black transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}

                {tabLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                  </div>
                ) : myPosts.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <p className="text-lg mb-2">Нет публикаций</p>
                    <p className="text-sm">Ваши публикации появятся здесь</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 px-1 md:px-0">
                    {myPosts.map((post) => (
                      <div
                        key={post.id}
                        draggable
                        onDragStart={(e) => handleDragStart(post, e)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => { e.preventDefault(); handleDrop(post); }}
                        onDragEnter={() => draggedPost && setDropTargetId(post.id)}
                        onDragLeave={() => setDropTargetId(null)}
                        className={`relative transition-all cursor-grab active:cursor-grabbing ${draggedPost?.id === post.id ? 'opacity-50 scale-95' : ''} ${dropTargetId === post.id ? 'ring-4 ring-black ring-offset-2 rounded-xl' : ''}`}
                      >
                        <PostCard
                          post={post}
                          onClick={(p) => !draggedPost && onSelectPost(p, myPosts)}
                          onFitClick={(e, p) => { if (onFitPost) onFitPost(p); }}
                          onSaveClick={(p) => onSavePost && onSavePost(p)}
                          hideActions={true}
                        />
                        {draggedPost && draggedPost.id !== post.id && (
                          <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center pointer-events-none">
                            <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full">
                              + Группа
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'following' && (
              <>
                {tabLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                  </div>
                ) : following.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <p className="text-lg mb-2">Нет подписок</p>
                    <p className="text-sm">Вы пока ни на кого не подписаны</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {following.map((followedUser) => (
                      <div key={followedUser.id} className="flex flex-col items-center bg-gray-50 rounded-[24px] p-6 border border-gray-100">
                        <div className="w-20 h-20 rounded-full bg-gray-200 mb-4 overflow-hidden flex items-center justify-center text-2xl font-bold text-gray-400">
                          {followedUser.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <h4 className="font-bold text-sm mb-1">@{followedUser.nickname || followedUser.name}</h4>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-4 line-clamp-1">{followedUser.bio || 'Fashion Lover'}</span>
                        <button
                          onClick={() => profileApi.unfollowUser(followedUser.id).then(() => {
                            setFollowing(prev => prev.filter(u => u.id !== followedUser.id));
                          })}
                          className="px-6 py-2 bg-white border border-gray-200 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all"
                        >
                          Отписаться
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'saved' && (
              <>
                {tabLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                  </div>
                ) : savedPosts.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <p className="text-lg mb-2">Нет сохранённых</p>
                    <p className="text-sm">Сохраняйте понравившиеся образы</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 px-1 md:px-0">
                    {savedPosts.map((post) => (
                      <div key={post.id}>
                        <PostCard
                          post={post}
                          onClick={(p) => onSelectPost(p, savedPosts)}
                          onFitClick={(e, p) => { if (onFitPost) onFitPost(p); }}
                          onAuthorClick={onNavigateToProfile}
                          onSaveClick={(p) => onSavePost && onSavePost(p)}
                          hideActions={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'liked' && (
              <>
                {tabLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                  </div>
                ) : likedPosts.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <p className="text-lg mb-2">Нет лайков</p>
                    <p className="text-sm">Лайкайте образы, чтобы они появились здесь</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 px-1 md:px-0">
                    {likedPosts.map((post) => (
                      <div key={post.id}>
                        <PostCard
                          post={post}
                          onClick={(p) => onSelectPost(p, likedPosts)}
                          onFitClick={(e, p) => { if (onFitPost) onFitPost(p); }}
                          onSaveClick={(p) => onSavePost && onSavePost(p)}
                          hideActions={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

          </div>
        </>
      )}
      {activeSection === 'edit_avatar' && (
        <AvatarSettingsView
          onBack={() => setActiveSection('profile')}
          embedded={true}
          avatars={avatars}
          activeAvatarId={activeAvatarId}
          onAddAvatar={onAddAvatar}
          onUpdateAvatar={onUpdateAvatar}
          onDeleteAvatar={onDeleteAvatar}
          onSetActiveAvatar={onSetActiveAvatar}
        />
      )}

      {activeSection === 'settings' && (
        <SettingsView
          onBack={() => setActiveSection('profile')}
          embedded={true}
        />
      )}

      {/* Group Creation Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6 text-center">Новая группа</h3>
            <div className="flex gap-2 justify-center mb-6">
              {pendingGroupPosts.map(p => (
                <div key={p.id} className="w-16 h-16 rounded-xl overflow-hidden">
                  <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <input
              autoFocus
              type="text"
              placeholder="Название группы..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold mb-6 focus:ring-2 focus:ring-black transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateGroup();
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setGroupName('');
                  setPendingGroupPosts([]);
                }}
                className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim()}
                className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-black text-white hover:bg-gray-900 transition-colors disabled:opacity-50"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarView;

