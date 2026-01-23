import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { avatarsApi, generationApi } from '../services/api';
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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
        onSetActiveAvatar(newAvatar.id);
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

    const handleGenerate = async () => {
        if (!activeAvatar) return;

        requireAuth(async () => {
            setIsGenerating(true);
            try {
                // 1. Prepare images (resize if needed, or just take first 3)
                const refImages = activeAvatar.referenceImages.filter(img => img).slice(0, 3);

                if (refImages.length === 0) {
                    alert('Загрузите хотя бы одно фото');
                    setIsGenerating(false);
                    return;
                }

                // 2. Create Prompt
                const messagesContent: any[] = [];

                // Add reference images
                for (let i = 0; i < refImages.length; i++) {
                    messagesContent.push({
                        type: "image_url",
                        image_url: { url: refImages[i] }
                    });
                }

                messagesContent.push({
                    type: "text",
                    text: `TASK: Create a professional, artistic, photorealistic FULL BODY avatar based on these photos.
                    
                    INSTRUCTION: Generate a high-quality full-body image of this person.
                    
                    STYLE: Professional fashion photography, soft studio lighting.
                    BACKGROUND: Clean, solid white background.
                    
                    CRITICAL RULES:
                    1. **IDENTITY**: Face must match the provided photos EXACTLY.
                    2. **POSE**: Standing confident full-body pose, looking at camera.
                    3. **FRAMING**: Show the entire person from head to toe. Do not crop the head or feet.
                    4. **QUALITY**: High resolution, sharp details, photorealistic.
                    
                    OUTPUT ONLY THE IMAGE.`
                });

                const messages = [{ role: "user", content: messagesContent }];

                // 3. Call API
                // Using nano-banana for image generation
                const data = await generationApi.generateImage({
                    model: "google/nano-banana",
                    messages: messages
                });

                console.log("[DEBUG] Generation Response:", JSON.stringify(data, null, 2));

                const message = data.choices?.[0]?.message;
                let generatedUrl = null;

                // 1. Check for native OpenRouter/Gemini image structure
                if (message?.images && message.images.length > 0) {
                    generatedUrl = message.images[0].image_url?.url;
                }
                // 2. Fallback: Check content for markdown image or URL
                else if (message?.content) {
                    const content = message.content;
                    if (content.startsWith('http')) {
                        generatedUrl = content;
                    } else {
                        const match = content.match(/\!\[.*?\]\((.*?)\)/);
                        if (match && match[1]) {
                            generatedUrl = match[1];
                        }
                    }
                }

                if (generatedUrl) {
                    onUpdateAvatar(activeAvatar.id, { generatedAvatarUrl: generatedUrl });
                    onUpdateAvatar(activeAvatar.id, { generatedAvatarUrl: generatedUrl });
                    setShowSuccessModal(true);
                } else {
                    console.error("No image found in response. Full JSON below:");
                    console.log(data);
                    alert('Ошибка: Изображение не получено. Проверьте консоль.');
                }

            } catch (e) {
                console.error(e);
                alert('Ошибка при генерации');
            } finally {
                setIsGenerating(false);
            }
        });
    };

    const { isNewUser, user, completeOnboarding } = useAuth();
    const [showWelcomeModal, setShowWelcomeModal] = useState(isNewUser);

    useEffect(() => {
        if (isNewUser) {
            setShowWelcomeModal(true);
        }
    }, [isNewUser]);

    return (
        <div className={`max-w-3xl mx-auto px-4 pb-20 ${embedded ? 'pt-0' : 'pt-16'}`}>
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && activeAvatar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-8 md:p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                        {avatars.length <= 1 ? (
                            <>
                                <h3 className="text-xl md:text-2xl font-bold mb-4">Нельзя удалить</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed">
                                    У вас должен быть хотя бы один аватар. Создайте новый аватар перед удалением текущего.
                                </p>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="w-full py-4 bg-black text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-all"
                                >
                                    Понятно
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl md:text-2xl font-bold mb-4">Удалить аватар?</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed">
                                    Вы уверены, что хотите удалить аватар <b>"{activeAvatar.name}"</b>? Это действие нельзя отменить.
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        onClick={() => {
                                            onDeleteAvatar(activeAvatar.id);
                                            setShowDeleteConfirm(false);
                                        }}
                                        className="flex-1 py-4 bg-red-500 text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-red-600 active:scale-95 transition-all shadow-lg"
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {showWelcomeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-8 md:p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 text-center">
                        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                            <span className="text-4xl">✨</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-4">Добро пожаловать, {user?.name}!</h3>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            Чтобы начать примерку, нам нужно создать ваш <b>Цифровой Аватар</b>.
                            <br /><br />
                            Загрузите несколько ваших фото, где хорошо видно лицо. Мы используем их для генерации реалистичных образов.
                        </p>
                        <button
                            onClick={() => {
                                if (avatars.length === 0) {
                                    handleCreateAvatar();
                                } else if (!activeAvatarId && avatars.length > 0) {
                                    onSetActiveAvatar(avatars[0].id);
                                }
                                setShowWelcomeModal(false);
                                completeOnboarding(); // Reset isNewUser flag
                            }}
                            className="w-full py-4 bg-black text-white rounded-full font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            Создать Аватар
                        </button>
                    </div>
                </div>
            )}
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
                            onDoubleClick={() => avatar.referenceImages[0] && setLightboxImage(avatar.referenceImages[0])}
                            className={`relative flex flex-col items-center gap-2 group transition-all ${activeAvatarId === avatar.id ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}`}
                            title="Клик - выбрать, Двойной клик - увеличить"
                        >
                            <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${activeAvatarId === avatar.id ? 'border-black shadow-lg' : 'border-transparent group-hover:border-gray-200'}`}>
                                {(avatar.generatedAvatarUrl || avatar.referenceImages[0]) ? (
                                    <img src={avatar.generatedAvatarUrl || avatar.referenceImages[0]} className="w-full h-full object-cover" alt={avatar.name} />
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

                            {/* Generated Avatar Preview */}
                            {activeAvatar.generatedAvatarUrl && (
                                <div className="mt-6 flex flex-col items-start animate-in fade-in slide-in-from-top-2 duration-500 w-full">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Сгенерированный аватар</label>
                                    <div
                                        className="w-full aspect-[3/4] sm:aspect-square md:aspect-[3/4] rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all relative group bg-gray-50"
                                        onClick={() => setLightboxImage(activeAvatar.generatedAvatarUrl!)}
                                    >
                                        <img src={activeAvatar.generatedAvatarUrl} className="w-full h-full object-cover object-top" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 drop-shadow-md transform scale-90 group-hover:scale-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-bold mb-2">Фотографии</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Загрузите 3-5 фото для этого аватара. Нажмите на фото для просмотра.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Array.from({ length: 5 }).map((_, index) => {
                                const image = activeAvatar.referenceImages[index];
                                return (
                                    <div key={index} className="aspect-[3/4] bg-gray-50 rounded-[20px] relative overflow-hidden border-2 border-dashed border-gray-200 group">
                                        {image ? (
                                            <>
                                                <img
                                                    src={image}
                                                    alt=""
                                                    className="w-full h-full object-cover cursor-pointer"
                                                    onClick={() => setLightboxImage(image)}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                                                    <div className="bg-white/90 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                        <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" /></svg>
                                                    </div>
                                                </div>
                                                {/* Change photo button */}
                                                <label className="absolute bottom-2 right-2 bg-white/90 hover:bg-white p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(index, e)} />
                                                </label>
                                            </>
                                        ) : (
                                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all">
                                                <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" /></svg>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Фото {index + 1}</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(index, e)} />
                                            </label>
                                        )}
                                    </div>
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

                    <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-14 h-14 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all flex items-center justify-center shrink-0"
                            title="Удалить аватар"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
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

            {/* Lightbox Modal for viewing avatar photos */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setLightboxImage(null)}
                >
                    {/* Close button */}
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Image container */}
                    <div
                        className="relative max-w-4xl max-h-[85vh] animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={lightboxImage}
                            alt="Аватар в полном размере"
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                        />
                    </div>

                    {/* Hint text */}
                    <p className="absolute bottom-6 text-white/50 text-xs font-medium uppercase tracking-widest">
                        Нажмите на фон для закрытия
                    </p>
                </div>
            )}
            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center relative animate-in zoom-in-95 duration-300 shadow-2xl">
                        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>

                        <h3 className="text-xl font-bold mb-2">Готово!</h3>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                            Ваш цифровой аватар успешно создан. Теперь вы можете использовать его для примерки одежды.
                        </p>

                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl"
                        >
                            Отлично
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvatarSettingsView;
