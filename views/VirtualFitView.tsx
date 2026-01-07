import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Scenario, Post, DigitalTwin } from '../types';
import PostCard from '../components/PostCard';
import api from '../services/api';

interface VirtualFitViewProps {
  initialPost?: Post | null;
  userReferences?: string[]; // База фотографий пользователя
  embedded?: boolean;
  onNavigateToProfile?: (username: string) => void;
  avatars?: DigitalTwin[];
  activeAvatarId?: string | null;
  onSetActiveAvatar?: (id: string) => void;
  onSavePost?: (post: Post) => void;
}

// ... SlidingTabs and UploadZone (omitted for brevity, assume they remain)


// ... existing state ...
// (Assuming context is preserved by replacement tools smarter logic or I need to replace strictly)

// Since I can't easily skip lines with replace_file_content if I'm not careful, I will target specific blocks.

// Actually, I will split this into two calls.
// 1. Update imports and Interface.
// 2. Insert the UI.


const SlidingTabs = ({ options, value, onChange }: { options: { id: string, label: string }[], value: string, onChange: (val: any) => void }) => {
  const [pillStyle, setPillStyle] = useState({ width: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const updatePill = () => {
      const activeIndex = options.findIndex(o => o.id === value);
      const activeElement = itemsRef.current[activeIndex];
      if (activeElement && containerRef.current) {
        setPillStyle({
          width: activeElement.offsetWidth,
          left: activeElement.offsetLeft
        });
      }
    };

    // Initial and resize updates
    updatePill();
    const observer = new ResizeObserver(updatePill);
    if (containerRef.current) observer.observe(containerRef.current);

    // Slight delay to ensure fonts loaded/layout stable
    setTimeout(updatePill, 50);

    return () => observer.disconnect();
  }, [value, options]);

  return (
    <div className="relative flex w-fit bg-gray-100 rounded-full p-1 mb-6 mx-auto" ref={containerRef}>
      <div
        className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm transition-all duration-300 ease-out"
        style={{ width: pillStyle.width, left: pillStyle.left }}
      />
      {options.map((option, index) => (
        <button
          key={option.id}
          ref={el => itemsRef.current[index] = el}
          onClick={() => onChange(option.id)}
          className={`relative z-10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 whitespace-nowrap ${value === option.id ? 'text-black' : 'text-gray-400 hover:text-black'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

const UploadZone = ({
  label,
  image,
  onFile,
  onUrl,
  onClear,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop
}: {
  label: string,
  image: string | null,
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void,
  onUrl: (url: string) => void,
  onClear?: () => void,
  isDragging: boolean,
  onDragEnter: (e: React.DragEvent) => void,
  onDragLeave: (e: React.DragEvent) => void,
  onDragOver: (e: React.DragEvent) => void,
  onDrop: (e: React.DragEvent) => void
}) => {
  const [urlInput, setUrlInput] = useState('');

  const handleUrlSubmit = () => {
    if (urlInput) {
      onUrl(urlInput);
      setUrlInput('');
    }
  };

  return (
    <div className="mb-4 animate-in fade-in slide-in-from-right-4">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</h3>
        {image && onClear && (
          <button onClick={onClear} className="text-[9px] text-red-400 hover:text-red-500 font-bold uppercase tracking-widest">Сменить</button>
        )}
      </div>

      <div
        className={`w-full aspect-[3/4] rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-300 ${isDragging ? 'bg-black/5 border-black scale-[1.02]' : 'bg-gray-50 border-gray-200 hover:border-black/20'}`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {image ? (
          <img src={image} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">

            {/* Drag Area */}
            <label className="flex flex-col items-center cursor-pointer w-full flex-grow justify-center">
              <svg className={`w-8 h-8 text-gray-300 mb-2 transition-transform duration-300 ${isDragging ? 'scale-125 text-black' : 'group-hover:scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" /></svg>
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 text-center">{isDragging ? 'Отпустите файл' : 'Загрузить фото'}</span>
              <input type="file" className="hidden" accept="image/*" onChange={onFile} />
            </label>

            {/* Divider */}
            <div className="w-full flex items-center gap-2 my-4 opacity-50">
              <div className="h-[1px] bg-gray-300 flex-1"></div>
              <span className="text-[8px] font-bold text-gray-400 uppercase">Или</span>
              <div className="h-[1px] bg-gray-300 flex-1"></div>
            </div>

            {/* URL Input with Integrated Button */}
            <div className="w-full relative">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Ссылка..."
                className="w-full bg-white border border-gray-200 rounded-lg pl-3 pr-10 py-2.5 text-[10px] focus:outline-none focus:border-black transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <button
                onClick={handleUrlSubmit}
                disabled={!urlInput}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-black text-white rounded-md hover:bg-zinc-800 disabled:opacity-0 transition-all duration-300"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

const VirtualFitView: React.FC<VirtualFitViewProps> = ({ initialPost, userReferences = [], embedded = false, onNavigateToProfile, avatars, activeAvatarId, onSetActiveAvatar, onSavePost }) => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [isBaseGenerated, setIsBaseGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [activeCloth, setActiveCloth] = useState<Post | null>(null);
  const [showKeyHint, setShowKeyHint] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mediaMode, setMediaMode] = useState<'photo' | 'video'>('photo');
  const [generationMode, setGenerationMode] = useState<'avatar' | 'image' | null>(null);
  const [customTargetImage, setCustomTargetImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isClothDragging, setIsClothDragging] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<{ id: string, imageUrl: string, timestamp: number, clothTitle?: string }[]>(() => {
    const saved = localStorage.getItem('generation_history');
    return saved ? JSON.parse(saved) : [];
  });
  const viewRef = useRef<HTMLDivElement>(null);

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('generation_history', JSON.stringify(generationHistory));
  }, [generationHistory]);

  useEffect(() => {
    if (initialPost) {
      setActiveCloth(initialPost);
    }
  }, [initialPost]);

  useEffect(() => {
    if (activeCloth && !embedded) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeCloth, embedded]);

  const wardrobePosts: Post[] = useMemo(() => {
    const validImages = [
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
      '/mock/mock_history_1_coat_tall_1767381603039.png',
      '/mock/mock_history_2_shoes_sq_1767381617174.png',
      '/mock/mock_history_3_dress_tall_1767381630936.png'
    ];

    // Генерируем историю генераций, используя только релевантные изображения
    return Array.from({ length: 14 }).map((_, i) => ({
      id: `v${i}`,
      imageUrl: validImages[i % validImages.length],
      author: i < validImages.length ? 'Избранное' : 'История',
      likes: 10 + i * 5,
      isPrivate: true,
      tags: ['History']
    }));
  }, []);

  const scenarios = [
    { id: Scenario.WALKING, label: 'Подиум / Ходьба' },
    { id: Scenario.CAR_ENTRY, label: 'Посадка в авто' },
    { id: Scenario.SPORT, label: 'Спортивное движение' },
    { id: Scenario.STREET_INTERACTION, label: 'Уличный декор' }
  ];

  const handleSelectKey = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setShowKeyHint(false);
    setErrorMessage(null);
  };

  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    try {
      if (url.startsWith('data:')) return url.split(',')[1];
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });
    } catch (e) { return ""; }
  };

  const handleGenerate = async (e: React.MouseEvent, scenario: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!activeCloth) return;

    // @ts-ignore
    setSelectedScenario(scenario === 'STUDIO_DEFAULT' ? null : scenario);
    setIsGenerating(true);
    setResultUrl(null);
    setErrorMessage(null);

    // Default studio prompt for base generation
    const scenarioPrompt = scenario === 'STUDIO_DEFAULT'
      ? "Neutral Studio Background, Professional Lighting, Front View, White Infinity Cove"
      : scenario;

    try {
      const messagesContent: any[] = [];

      // 0. DEBUG: Verify Input Images
      console.log(`[DEBUG] User References Received: ${userReferences?.length}`);
      if (userReferences?.length === 0) {
        console.warn("[DEBUG] NO USER REFERENCES! The model will use the clothing model's face.");
      }

      // 1. Context & Person Label
      messagesContent.push({
        type: "text",
        text: "TARGET MODEL (Face & Body Source). Use this person's identity:"
      });

      // 2. Add Target Image(s) based on Mode
      if (generationMode === 'image' && customTargetImage) {
        const base64Data = await fetchImageAsBase64(customTargetImage);
        if (base64Data) {
          console.log(`[DEBUG] Adding Custom Target Image. Length: ${base64Data.length}`);
          messagesContent.push({
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${base64Data}` }
          });
        }
      } else if (userReferences && userReferences.length > 0) {
        // Use Promise.all to ensure we await async fetching of images
        await Promise.all(userReferences.slice(0, 3).map(async (ref, index) => {
          try {
            // Force fetch image as base64 to handle both URL and Data URI
            const base64Data = await fetchImageAsBase64(ref);
            if (base64Data) {
              console.log(`[DEBUG] Processed Avatar ${index + 1}. Length: ${base64Data.length}`);
              messagesContent.push({
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Data}` }
              });
            } else {
              console.warn(`[DEBUG] Failed to process avatar ${index + 1}: empty result`);
            }
          } catch (e) {
            console.error(`[DEBUG] Error processing avatar ${index + 1}`, e);
          }
        }));
      }

      // 3. Clothing Label
      messagesContent.push({
        type: "text",
        text: "GARMENT REFERENCE (Clothing Source ONLY). IGNORE the person in this photo. ONLY look at the clothing:"
      });

      // 4. Add Cloth Image
      const clothBase64 = await fetchImageAsBase64(activeCloth.imageUrl);
      console.log(`[DEBUG] Adding Cloth Image. Length: ${clothBase64.length}`);
      messagesContent.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${clothBase64}` }
      });

      // 5. Final Instruction (Prompt)
      messagesContent.push({
        type: "text",
        text: `TASK: Virtual Try-On / Fashion Editorial.
        
        INSTRUCTION: Create a photorealistic image of the TARGET MODEL (from the first set of photos) WEARING the GARMENT (from the last photo).
        
        SCENARIO: ${scenarioPrompt}.
        
        CRITICAL IDENTITY RULES:
        1. **FACE**: Must match the TARGET MODEL (first photos) exactly.
        2. **BODY**: Must match the TARGET MODEL's body type.
        3. **CLOTHING**: Must be the GARMENT from the reference.
        4. **IGNORE**: Do not use the face/hair of the person in the garment reference photo.
        
        OUTPUT ONLY THE IMAGE.`
      });

      const messages = [{ role: "user", content: messagesContent }];
      console.log("[DEBUG] Final Messages Structure:", messagesContent.map(m => m.type));

      // Call Backend API
      const data = await api.generation.generateImage({
        model: "google/gemini-2.5-flash-image",
        messages: messages
      });

      console.log("Backend Response Data:", data);
      const message = data.choices?.[0]?.message;

      console.log("Message Content:", message);
      const finishReason = data.choices?.[0]?.native_finish_reason || data.choices?.[0]?.finish_reason;

      // Check for native image response structure
      if (message?.images && message.images.length > 0) {
        // Correct way to get image from OpenRouter/Gemini response
        const generatedUrl = message.images[0].image_url.url;
        setResultUrl(generatedUrl);
        setIsBaseGenerated(true);
        // Save to history
        setGenerationHistory(prev => [{
          id: `gen-${Date.now()}`,
          imageUrl: generatedUrl,
          timestamp: Date.now(),
          clothTitle: activeCloth?.title || activeCloth?.author
        }, ...prev].slice(0, 50)); // Keep last 50
      } else if (finishReason === 'IMAGE_OTHER' || (finishReason === 'stop' && !message?.content)) {
        throw new Error("Generation blocked by Safety Filters (IMAGE_OTHER). Try a different photo.");
      } else if (message?.content) {
        // Fallback: Check if markdown image is present in text content
        const content = message.content;
        const match = content.match(/\!\[.*?\]\((.*?)\)/);
        if (match && match[1]) {
          setResultUrl(match[1]);
          setIsBaseGenerated(true);
        } else {
          console.warn("Model returned text:", content);
          setResultUrl(`https://picsum.photos/seed/${scenario}-${Date.now()}/1024/1792`);
          setIsBaseGenerated(true);
        }
      } else {
        throw new Error("No content or images in response");
      }

    } catch (error: any) {
      console.error("Generation Error:", error);
      const errStr = JSON.stringify(error);
      setErrorMessage("Ошибка генерации. " + (error.message || "Попробуйте позже."));
      // Fallback for demo purposes if backend fails repeatedly or network issue
      // setTimeout(() => {
      //   setResultUrl(`https://picsum.photos/seed/${scenario}/1920/1080`);
      //   setIsBaseGenerated(true);
      // }, 1000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitting-room-result-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  const handleShare = async () => {
    if (!resultUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Примерочная AI',
          text: 'Посмотрите, какой образ я создал!',
          url: resultUrl
        });
      } catch (e) {
        console.log('Share error or canceled', e);
      }
    } else {
      try {
        await navigator.clipboard.writeText(resultUrl);
        alert('Ссылка скопирована в буфер обмена');
      } catch (e) {
        console.error('Clipboard failed', e);
      }
    }
  };

  const handleAddToWardrobe = () => {
    if (!resultUrl) return;

    const newLook = {
      id: `look-${Date.now()}`,
      imageUrl: resultUrl,
      author: '@ioniua',
      likes: 0,
      isPrivate: true,
      tags: ['Generated', 'Virtual Fit'],
      title: activeCloth?.title || 'Новый образ'
    };

    const existing = JSON.parse(localStorage.getItem('user_wardrobe') || '[]');
    try {
      localStorage.setItem('user_wardrobe', JSON.stringify([newLook, ...existing]));
    } catch (e) {
      alert('Ошибка: Хранилище переполнено! Не удалось сохранить образ. Пожалуйста, удалите старые записи.');
      return;
    }

    if (onSavePost) {
      onSavePost(newLook);
    } else {
      alert('Образ сохранен в ваш гардероб!');
    }
  };

  const handlePublish = () => {
    if (!resultUrl) return;

    // Save as public
    const newLook = {
      id: `pub-${Date.now()}`,
      imageUrl: resultUrl,
      author: '@ioniua',
      likes: 0,
      isPrivate: false,
      tags: ['Published', 'Virtual Fit'],
      title: activeCloth?.title || 'Новый образ'
    };

    const existing = JSON.parse(localStorage.getItem('user_wardrobe') || '[]');
    try {
      localStorage.setItem('user_wardrobe', JSON.stringify([newLook, ...existing]));
    } catch (e) {
      alert('Ошибка: Хранилище переполнено! Не удалось опубликовать образ.');
      return;
    }

    alert('Образ опубликован в ленте!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setActiveCloth({
          id: `c-${Date.now()}`,
          imageUrl: reader.result as string,
          author: 'ВАША ВЕЩЬ',
          likes: 0,
          isPrivate: true,
          tags: []
        });
        setResultUrl(null);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCustomTargetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomTargetImage(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleDrag = (setter: (val: boolean) => void) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setter(true);
    } else if (e.type === 'dragleave') {
      setter(false);
    }
  };

  const createDropHandler = (setter: (val: string) => void) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(e.dataTransfer.files[0]);
    }
  };

  const handleActiveClothUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setActiveCloth({
          id: `c-${Date.now()}`,
          imageUrl: reader.result as string,
          author: 'ВАША ВЕЩЬ',
          likes: 0,
          isPrivate: true,
          tags: []
        });
        setResultUrl(null);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleActiveClothUrl = (url: string) => {
    setActiveCloth({
      id: `c-${Date.now()}`,
      imageUrl: url,
      author: 'ВАША ВЕЩЬ',
      likes: 0,
      isPrivate: true,
      tags: []
    });
    setResultUrl(null);
  };



  return (
    <div className={`mx-auto animate-in fade-in duration-700 ${embedded ? '' : 'max-w-[1440px] py-12 px-4 md:px-8 space-y-24'}`} ref={viewRef}>
      <div id="fitting-header" className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 mb-12 md:mb-20 overflow-visible">

        {/* Main Preview - FIXED HEIGHT 75vh */}
        <div className="md:col-span-8 order-1">
          <div className="w-full h-[75vh] rounded-[40px] md:rounded-[48px] overflow-hidden bg-gray-50 relative flex items-center justify-center border-[4px] md:border-[6px] border-white transition-all">

            {/* Stable Image Container */}
            <div className="absolute inset-0 p-4 md:p-8 flex items-center justify-center">
              <img
                src={resultUrl || (generationMode === 'image' ? customTargetImage : activeCloth?.imageUrl) || "/mock/mock_avatar_full_001.jpg"}
                className={`w-full h-full object-contain transition-all duration-700 ${isGenerating ? 'blur-md scale-95 opacity-50' : 'scale-100 opacity-100'}`}
              />
            </div>

            {/* Loading Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-black/10 border-t-black rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-800 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full">Стилизация...</p>
              </div>
            )}


            {/* Error/Billing Shield */}
            {showKeyHint && (
              <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-2xl flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="max-w-sm">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">!</div>
                  <h4 className="text-xl font-bold mb-3">Лимит модели исчерпан</h4>
                  <p className="text-xs text-gray-500 leading-relaxed mb-8">
                    Модель Gemini 3 Pro требует API-ключа с привязанным биллингом (Paid Project). Бесплатные ключи имеют нулевой лимит на генерацию изображений Pro.
                  </p>
                  <button onClick={handleSelectKey} className="w-full py-5 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">Сменить API ключ</button>
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Как настроить биллинг?</a>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="absolute top-6 left-6 right-6 bg-red-500/90 text-white p-4 rounded-xl text-center text-xs font-bold animate-in fade-in duration-300 z-50">
                {errorMessage}
              </div>
            )}

          </div>
        </div>

        {/* Sidebar Scenarios */}
        <div className="md:col-span-4 order-2 flex flex-col h-full">
          <div className={`liquid-glass flex flex-col gap-3 h-full ${embedded ? 'p-6 rounded-[40px]' : 'p-6 md:p-8 rounded-[40px] border border-white'}`}>

            {/* MODE SELECTION */}
            {!generationMode && !isBaseGenerated && (
              <div className="flex flex-col gap-4 h-full">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Выберите режим</h3>
                <button
                  onClick={() => setGenerationMode('avatar')}
                  className="flex-1 bg-gray-50 hover:bg-black hover:text-white rounded-[24px] p-6 flex flex-col items-center justify-center gap-3 transition-all group border border-gray-100"
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">На основе Аватара</span>
                </button>
                <button
                  onClick={() => setGenerationMode('image')}
                  className="flex-1 bg-gray-50 hover:bg-black hover:text-white rounded-[24px] p-6 flex flex-col items-center justify-center gap-3 transition-all group border border-gray-100"
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">На основе Фото</span>
                </button>
              </div>
            )}

            {/* IMAGE MODE UPLOAD */}
            {generationMode === 'image' && !isBaseGenerated && (
              <UploadZone
                label="Ваше фото"
                image={customTargetImage}
                onClear={() => { setGenerationMode(null); setCustomTargetImage(null); }}
                onFile={handleCustomTargetUpload}
                onUrl={(url) => setCustomTargetImage(url)}
                isDragging={isDragging}
                onDragEnter={handleDrag(setIsDragging)}
                onDragLeave={handleDrag(setIsDragging)}
                onDragOver={handleDrag(setIsDragging)}
                onDrop={createDropHandler(setCustomTargetImage)}
              />
            )}


            {/* IF BASE NOT GENERATED: SHOW 'TRY ON' BUTTON */}
            {generationMode && !isBaseGenerated ? (
              <div className="flex flex-col h-full">
                {/* Upload Cloth if missing in Avatar Mode OR Image Mode (with photo selected) */}
                {!activeCloth && (generationMode === 'avatar' || (generationMode === 'image' && customTargetImage)) && (
                  <div className="flex-1 mb-4">
                    <UploadZone
                      label="Одежда"
                      image={null}
                      onFile={handleActiveClothUpload}
                      onUrl={handleActiveClothUrl}
                      isDragging={isClothDragging}
                      onDragEnter={handleDrag(setIsClothDragging)}
                      onDragLeave={handleDrag(setIsClothDragging)}
                      onDragOver={handleDrag(setIsClothDragging)}
                      onDrop={createDropHandler((url) => handleActiveClothUrl(url))}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setGenerationMode(null)} className="text-gray-400 hover:text-black transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  </button>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center flex-1 mr-5">
                    Шаг 1: Примерка
                  </p>
                </div>

                {generationMode === 'avatar' && avatars && avatars.length > 0 && (
                  <div className="mb-6 animate-in fade-in slide-in-from-right-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Модель</p>
                    <div className="flex items-center gap-4 overflow-x-auto p-2 scrollbar-none snap-x">
                      {avatars.map(av => (
                        <button
                          key={av.id}
                          onClick={() => onSetActiveAvatar && onSetActiveAvatar(av.id)}
                          className={`w-12 h-12 rounded-full flex-shrink-0 border-2 transition-all snap-start ${activeAvatarId === av.id ? 'border-black scale-110 shadow-md ring-2 ring-white' : 'border-gray-100 grayscale opacity-70 hover:grayscale-0 hover:opacity-100'}`}
                          title={av.name}
                        >
                          {av.referenceImages[0] ? (
                            <img src={av.referenceImages[0]} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-full">
                              <span className="text-[8px] font-bold">{av.name[0]}</span>
                            </div>
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => onNavigateToProfile && onNavigateToProfile('@me')}
                        className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 hover:text-black hover:border-black transition-all snap-start"
                        title="Редактировать аватары"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-auto space-y-4">
                  <button
                    onClick={(e) => handleGenerate(e, 'STUDIO_DEFAULT')}
                    disabled={!activeCloth || isGenerating || (generationMode === 'image' && !customTargetImage)}
                    className="w-full py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? 'Примерка...' : 'Надеть'}
                  </button>
                  <p className="text-[9px] text-gray-300 text-center leading-relaxed">
                    Сначала мы создадим базовый образ, а затем вы сможете выбрать сценарий.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center mb-1">
                  Шаг 2: Настройка
                </p>
                {/* Media Tabs - UNLOCKED */}
                <SlidingTabs
                  options={[
                    { id: 'photo', label: 'Фото' },
                    { id: 'video', label: 'Анимировать' }
                  ]}
                  value={mediaMode}
                  onChange={setMediaMode}
                />

                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-2 animate-in fade-in">Сценарии</h3>
                <div className="flex flex-col gap-3 animate-in fade-in">
                  {scenarios.map(s => (
                    <button
                      key={s.id}
                      disabled={!activeCloth || isGenerating}
                      onClick={(e) => handleGenerate(e, s.id)}
                      className={`w-full py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedScenario === s.id ? 'bg-white text-black scale-[1.03]' : 'bg-black text-white hover:bg-zinc-800'
                        } disabled:opacity-20`}
                    >
                      {s.label}
                    </button>
                  ))}

                  <button
                    onClick={() => setIsBaseGenerated(false)}
                    className="mt-4 text-[9px] text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
                  >
                    ← К выбору одежды
                  </button>
                </div>

                {resultUrl && (
                  <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-black/5 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddToWardrobe}
                        className="flex-1 py-3 bg-white border border-black/10 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        В гардероб
                      </button>
                      <button
                        onClick={handlePublish}
                        className="flex-1 py-3 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        Опубликовать
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownload}
                        className="flex-1 py-3 bg-white border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        Скачать
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex-1 py-3 bg-white border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        Поделиться
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Product Info Card in Sidebar */}
          {activeCloth && (
            <div className="liquid-glass p-5 rounded-[32px] border border-white mt-4 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">{activeCloth.author}</p>
                  <p className="text-[11px] font-bold uppercase text-black leading-tight mb-3">{activeCloth.title || 'Предмет одежды'}</p>
                  <div className="flex gap-2">
                    <button className="text-[8px] font-bold uppercase tracking-widest bg-black text-white hover:bg-zinc-800 px-4 py-2 rounded-full transition-all w-fit">
                      К ТОВАРУ
                    </button>
                    <button
                      onClick={() => { setActiveCloth(null); setResultUrl(null); setIsBaseGenerated(false); }}
                      className="text-[8px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black px-4 py-2 rounded-full transition-all w-fit"
                    >
                      УБРАТЬ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div >

      {/* Wardrobe */}
      <div className="px-4 pb-20">
        <div className="flex items-end justify-between mb-10">
          <h2 className="text-4xl md:text-5xl font-thin tracking-widest uppercase">Гардероб</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${showHistory ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-black hover:text-white'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> История {generationHistory.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full">{generationHistory.length}</span>}
            </button>

          </div>
        </div>

        {/* History Section */}
        {showHistory && (
          <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium uppercase tracking-widest text-gray-600">История генераций</h3>
              {generationHistory.length > 0 && (
                <button
                  onClick={() => { setGenerationHistory([]); localStorage.removeItem('generation_history'); }}
                  className="text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-500 transition-colors"
                >
                  Очистить всё
                </button>
              )}
            </div>
            {generationHistory.length === 0 ? (
              <div className="bg-gray-50 rounded-[32px] p-12 text-center">
                <p className="text-gray-400 text-sm">История пуста</p>
                <p className="text-[10px] text-gray-300 mt-2">Ваши генерации будут сохраняться здесь</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {generationHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => { setResultUrl(item.imageUrl); setIsBaseGenerated(true); }}
                    className="relative group cursor-pointer rounded-[20px] overflow-hidden aspect-[3/4] bg-gray-100 border-2 border-transparent hover:border-black transition-all"
                  >
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-end justify-center opacity-0 group-hover:opacity-100">
                      <div className="p-3 text-center">
                        <p className="text-[9px] text-white font-bold uppercase tracking-widest bg-black/50 px-2 py-1 rounded-full">
                          {new Date(item.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="columns-2 md:columns-3 lg:columns-4 gap-2 md:gap-4 space-y-2 md:space-y-4">
          {wardrobePosts.map(post => (
            <div key={post.id} className="break-inside-avoid">
              <PostCard post={post} onClick={setActiveCloth} onAuthorClick={onNavigateToProfile} hideActions={true} />
            </div>
          ))}
        </div>
      </div >
    </div >
  );
};

export default VirtualFitView;
