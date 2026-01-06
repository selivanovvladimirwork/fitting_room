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
          <div className="mb-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-1">
              @{user?.nickname || user?.name || 'USER'}
            </h1>
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
            Редактировать
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
              {['my_posts', 'groups', 'following', 'saved', 'downloaded', 'generated', 'liked'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                  {tab === 'groups' && 'Группы'}
                  {tab === 'my_posts' && 'Публикации'}
                  {tab === 'following' && 'Подписки'}
                  {tab === 'saved' && 'Избранное'}
                  {tab === 'downloaded' && 'Скачанное'}
                  {tab === 'generated' && 'Мои генерации'}
                  {tab === 'liked' && 'Лайки'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in duration-500 min-h-[400px]">
            {activeTab === 'groups' && (
              <>
                {viewCollection ? (
                  <div className="animate-in fade-in slide-in-from-right-4">
                    {/* Collection Detail Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setViewCollection(null)}
                          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h2 className="text-2xl font-bold">{collections.find(c => c.id === viewCollection)?.name}</h2>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Удалить эту группу?')) {
                            onDeleteCollection(viewCollection);
                            setViewCollection(null);
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>

                    {/* Items Grid */}
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4">
                      {collections.find(c => c.id === viewCollection)?.items.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-gray-400">
                          <p>В этой группе пока нет образов</p>
                        </div>
                      ) : (
                        collections.find(c => c.id === viewCollection)?.items.map((post, idx) => (
                          <div key={post.id} className="break-inside-avoid mb-4">
                            <PostCard
                              post={post}
                              onClick={(p) => onSelectPost(p, [])}
                              hideActions
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Create Button */}
                    <button
                      onClick={onOpenCreateCollection}
                      className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-black hover:text-black hover:bg-white transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Создать</span>
                    </button>

                    {/* Collection List */}
                    {collections.map(collection => (
                      <div
                        key={collection.id}
                        onClick={() => setViewCollection(collection.id)}
                        className="relative group cursor-pointer hover:z-20"
                      >
                        {/* Stack Layers - Diagonal Deck */}
                        <div className="absolute inset-0 bg-white border border-gray-200 rounded-[32px] translate-x-3 group-hover:translate-x-5 transition-transform duration-500 ease-out shadow-sm"></div>
                        <div className="absolute inset-0 bg-white border border-gray-200 rounded-[32px] translate-x-2 group-hover:translate-x-3.5 transition-transform duration-500 ease-out shadow-sm"></div>
                        <div className="absolute inset-0 bg-white border border-gray-200 rounded-[32px] translate-x-1 group-hover:translate-x-2 transition-transform duration-500 ease-out shadow-sm"></div>

                        {/* Main Card */}
                        <div className="relative aspect-square bg-white rounded-[32px] p-6 flex flex-col justify-between border border-gray-100 transition-transform duration-300 shadow-sm z-10">
                          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-black group-hover:scale-110 transition-transform shadow-sm">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                          </div>
                          <div>
                            <h4 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{collection.name}</h4>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{collection.items.length} фото</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

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

            {(activeTab === 'downloaded' || activeTab === 'generated') && (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                </div>
                <p className="text-gray-400 font-medium text-sm">В этом разделе пока пусто</p>
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
