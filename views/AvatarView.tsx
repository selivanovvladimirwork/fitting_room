import React, { useState } from 'react';
import { Post, DigitalTwin, Collection } from '../types';
import PostCard from '../components/PostCard';
import SettingsView from './SettingsView';
import AvatarSettingsView from './AvatarSettingsView';

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
  collections: Collection[];
  onOpenCreateCollection: () => void;
  onDeleteCollection: (id: string) => void;
  onSavePost?: (post: Post) => void;
}

import { useAuth } from '../context/AuthContext';

const AvatarView: React.FC<AvatarViewProps> = ({ onNavigateSubscription, onNavigateToFittingRoom, onSelectPost, onFitPost, onLogout, onNavigateToProfile, avatars, activeAvatarId, onAddAvatar, onUpdateAvatar, onDeleteAvatar, onSetActiveAvatar, collections, onOpenCreateCollection, onDeleteCollection, onSavePost }) => {
  const { requireAuth, user } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'settings' | 'edit_avatar'>('profile');
  const [activeTab, setActiveTab] = useState<'groups' | 'following' | 'saved' | 'liked' | 'my_posts'>('my_posts');
  const [viewCollection, setViewCollection] = useState<string | null>(null);

  // Bio Editing State
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || '');

  // Update bioText when user changes (e.g. after save)
  React.useEffect(() => {
    if (user?.bio) setBioText(user.bio);
  }, [user?.bio]);

  const handleSaveBio = async () => {
    if (bioText === user?.bio) {
      setIsEditingBio(false);
      return;
    }

    try {
      // Optimistic update would require Context update, but for now we reload or wait for re-fetch
      // Ideally AuthContext should expose an update method.
      // We will assume api.auth.updateProfile exists and works, then we might need to refresh user.
      // Since AuthContext doesn't have updateUser, we might just rely on a page refresh or context reload if available.
      // Actually, we should probably add updateUser to AuthContext or just call login again? No.
      // Let's call the API directly here.

      const { authApi } = require('../services/api'); // Dynamic import to avoid cycles/errors if not fully ready? No, explicit import above.
      // Actually we need to import authApi.

      await import('../services/api').then(async ({ authApi }) => {
        await authApi.updateProfile({ bio: bioText });
        // Force reload user in context? context.setUser would be ideal.
        // For now, let's just refresh the page or rely on next fetch.
        window.location.reload();
      });

    } catch (e) {
      console.error(e);
    }
    setIsEditingBio(false);
  };

  // handleCreateGroup removed, utilizing onOpenCreateCollection directly

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
                    onBlur={handleSaveBio}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveBio();
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-600 focus:ring-2 focus:ring-black outline-none resize-none"
                    rows={3}
                    placeholder="Расскажите о себе (до 120 символов)..."
                  />
                  <div className="flex justify-between items-center mt-1 px-1">
                    <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">{bioText.length}/120</span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Enter для сохранения</span>
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
              <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4 px-1 md:px-0">
                {/* Mock My Posts */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={`mypost-${i}`} className="break-inside-avoid mb-4">
                    <PostCard
                      post={{
                        id: `mypost-${i}`,
                        imageUrl: MOCK_IMAGES[(i * 2) % MOCK_IMAGES.length],
                        author: '@ioniua',
                        likes: 20 + i * 5,
                        isPrivate: false,
                        tags: ['My Style']
                      }}
                      onClick={(p) => onSelectPost(p, [])}
                      onFitClick={(e, p) => { if (onFitPost) onFitPost(p); }}
                      onSaveClick={(p) => onSavePost && onSavePost(p)}
                      hideActions={true}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'following' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Mock Subscribed Users */}
                {['@urban_style', '@minimal_fit', '@vogue_daily', '@street_god', '@denim_cult', '@fashion_ai'].map((user, i) => (
                  <div key={user} className="flex flex-col items-center bg-gray-50 rounded-[24px] p-6 border border-gray-100">
                    <div className="w-20 h-20 rounded-full bg-gray-200 mb-4 overflow-hidden">
                      <img src={MOCK_IMAGES[i % MOCK_IMAGES.length]} className="w-full h-full object-cover" />
                    </div>
                    <h4 className="font-bold text-sm mb-1">{user}</h4>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-4">Fashion Blogger</span>
                    <button className="px-6 py-2 bg-white border border-gray-200 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all">
                      Отписаться
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4 px-1 md:px-0">
                {/* Mock Saved Posts */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={`saved-${i}`} className="break-inside-avoid mb-4">
                    <PostCard
                      post={{
                        id: `saved-${i}`,
                        imageUrl: MOCK_IMAGES[i % MOCK_IMAGES.length],
                        author: '@brand_store',
                        likes: 120 + i * 50,
                        isPrivate: false,
                        tags: ['Saved']
                      }}
                      onClick={(p) => onSelectPost(p, [])}
                      onFitClick={(e, p) => { if (onFitPost) onFitPost(p); }}
                      onAuthorClick={onNavigateToProfile}
                      onSaveClick={(p) => onSavePost && onSavePost(p)}
                      hideActions={true}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'liked' && (
              <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4 px-1 md:px-0">
                {/* Mock Liked Posts */}
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={`liked-${i}`} className="break-inside-avoid mb-4">
                    <PostCard
                      post={{
                        id: `liked-${i}`,
                        imageUrl: MOCK_IMAGES[(i + 5) % MOCK_IMAGES.length],
                        author: `@liked_creator_${i}`,
                        likes: 500 + i * 100,
                        isPrivate: false,
                        tags: ['Liked']
                      }}
                      onClick={(p) => onSelectPost(p, [])}
                      onFitClick={(e, p) => { if (onFitPost) onFitPost(p); }}
                      onSaveClick={(p) => onSavePost && onSavePost(p)}
                      hideActions={true}
                    />
                  </div>
                ))}
              </div>
            )}


          </div>
        </>
      )}

      {activeSection === 'settings' && (
        <SettingsView onBack={() => setActiveSection('profile')} embedded={true} />
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
    </div >
  );
};

export default AvatarView;
