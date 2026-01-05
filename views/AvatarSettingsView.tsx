import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DigitalTwin } from '../types';

interface AvatarSettingsViewProps {
    onBack: () => void;
    embedded?: boolean;
    avatars: DigitalTwin[];
    activeAvatarId: string | null;
    onAddAvatar: (avatar: DigitalTwin) => void;
    onUpdateAvatar: (id: string, updates: Partial<DigitalTwin>) => void;
    onDeleteAvatar: (id: string) => void;
    onSetActiveAvatar: (id: string) => void;
}

const AvatarSettingsView: React.FC<AvatarSettingsViewProps> = ({
    onBack,
    embedded = false,
    avatars,
    activeAvatarId,
    onAddAvatar,
    onUpdateAvatar,
    onDeleteAvatar,
    onSetActiveAvatar
}) => {
    const { requireAuth } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);

    const activeAvatar = avatars.find(a => a.id === activeAvatarId);

    // Initialize with a default avatar if none exist
    useEffect(() => {
        if (avatars.length === 0) {
            handleCreateAvatar();
        } else if (!activeAvatarId && avatars.length > 0) {
            onSetActiveAvatar(avatars[0].id);
        }
    }, [avatars.length, activeAvatarId]);

    const handleCreateAvatar = () => {
        const newAvatar: DigitalTwin = {
            id: `avatar_${Date.now()}`,
            name: `Avatar ${avatars.length + 1}`,
            referenceImages: Array(5).fill(''), // Initialize with 5 empty slots
            stats: { height: 175, weight: 70, chest: 90, waist: 70, hips: 95 }
        };
        onAddAvatar(newAvatar);
    };

    const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && activeAvatar) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const newImages = [...activeAvatar.referenceImages];
                // Ensure array has enough slots
                while (newImages.length <= index) newImages.push('');

                newImages[index] = ev.target?.result as string;
                onUpdateAvatar(activeAvatar.id, { referenceImages: newImages });
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleGenerate = () => {
        requireAuth(() => {
            setIsGenerating(true);
            setTimeout(() => {
                setIsGenerating(false);
                alert('Аватар успешно обновлен!');
                if (!embedded) onBack();
            }, 2000);
        });
    };

    return (
        <div className={`max-w-3xl mx-auto px-4 pb-20 ${embedded ? 'pt-0' : 'pt-6'}`}>
            {!embedded && (
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-2xl font-bold tracking-tight">Настройки аватара</h2>
                </div>
            )}

            {/* Avatar Selector List */}
            <div className="mb-8 overflow-x-auto p-4">
                <div className="flex gap-4 items-start min-w-max px-1">
                    {avatars.map(avatar => (
                        <button
                            key={avatar.id}
                            onClick={() => onSetActiveAvatar(avatar.id)}
                            className={`relative flex flex-col items-center gap-2 group transition-all ${activeAvatarId === avatar.id ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}`}
                        >
                            <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${activeAvatarId === avatar.id ? 'border-black shadow-lg' : 'border-transparent group-hover:border-gray-200'}`}>
                                {avatar.referenceImages[0] ? (
                                    <img src={avatar.referenceImages[0]} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">{avatar.name}</span>
                        </button>
                    ))}

                    <button
                        onClick={handleCreateAvatar}
                        className="w-16 h-16 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-black hover:text-black hover:bg-white transition-all shrink-0"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    </button>
                </div>
            </div>

            {activeAvatar ? (
                <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Header: Name and Actions */}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                        <div className="flex-grow mr-4">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Название модели</label>
                            <div className="flex items-center gap-3 group">
                                <div className="p-2 rounded-full bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-black transition-all">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </div>
                                <input
                                    type="text"
                                    value={activeAvatar.name}
                                    onChange={(e) => onUpdateAvatar(activeAvatar.id, { name: e.target.value })}
                                    className="w-full text-xl font-bold bg-transparent border-none focus:ring-0 p-0 placeholder-gray-300 transition-colors"
                                    placeholder="Назовите аватар"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (confirm('Вы уверены, что хотите удалить этот аватар?')) {
                                    onDeleteAvatar(activeAvatar.id);
                                }
                            }}
                            className="p-3 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                            title="Удалить аватар"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-bold mb-2">Фотографии</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Загрузите 3-5 фото для этого аватара.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Array.from({ length: 5 }).map((_, index) => {
                                const image = activeAvatar.referenceImages[index];
                                return (
                                    <label key={index} className="aspect-[3/4] bg-gray-50 rounded-[20px] relative cursor-pointer hover:bg-gray-100 transition-all flex flex-col items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 hover:border-black/20 group">
                                        {image ? (
                                            <>
                                                <img src={image} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <div className="bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" /></svg>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Фото {index + 1}</span>
                                            </>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(index, e)} />
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Anthropometry Form */}
                    <div className="border-t border-gray-100 pt-8">
                        <h3 className="font-bold uppercase tracking-widest text-xs text-gray-400 mb-6">Антропометрия</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['height', 'weight', 'chest', 'waist', 'hips'].map(statKey => (
                                <div key={statKey} className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                        {statKey === 'height' && 'Рост'}
                                        {statKey === 'weight' && 'Вес'}
                                        {statKey === 'chest' && 'Обхват груди'}
                                        {statKey === 'waist' && 'Обхват талии'}
                                        {statKey === 'hips' && 'Обхват бедер'}
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={(activeAvatar.stats as any)[statKey] || ''}
                                        onChange={(e) => onUpdateAvatar(activeAvatar.id, { stats: { ...activeAvatar.stats, [statKey]: Number(e.target.value) } })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-black outline-none transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full md:w-auto px-12 py-4 bg-black text-white rounded-full font-bold uppercase tracking-[0.2em] text-xs hover:bg-zinc-800 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Cгенерировать модель
                                </>
                            ) : 'Создать модель'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-gray-400">
                    <p>Выберите аватар или создайте новый</p>
                </div>
            )}
        </div>
    );
};

export default AvatarSettingsView;
