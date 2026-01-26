import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Scenario, Post, DigitalTwin } from '../types';
import PostCard from '../components/PostCard';
import { generationApi, wardrobeApi, postsApi, savedLooksApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TokenIcon } from '../components/TokenIcon';
import Notification from '../components/Notification';
import ProductInfoModal from '../components/ProductInfoModal';
import InsufficientTokensModal from '../components/InsufficientTokensModal';


interface VirtualFitViewProps {
  initialPost?: Post | null;
  selectedItems?: Post[]; // Multi-select: array of items to combine
  userReferences?: string[]; // База фотографий пользователя
  embedded?: boolean;
  onNavigateToProfile?: (username: string) => void;
  onNavigateSubscription?: () => void;
  avatars?: DigitalTwin[];
  activeAvatarId?: string | null;
  onSetActiveAvatar?: (id: string) => void;
  onSavePost?: (post: Post) => void;
}


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

const VirtualFitView: React.FC<VirtualFitViewProps> = ({ initialPost, selectedItems = [], userReferences = [], embedded = false, onNavigateToProfile,
  onNavigateSubscription,
  avatars,
  activeAvatarId,
  onSetActiveAvatar,
  onSavePost,
}) => {
  const { user, requireAuth, refreshUser } = useAuth();
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [isBaseGenerated, setIsBaseGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [initialResultUrl, setInitialResultUrl] = useState<string | null>(null); // To store the base photo for video generation
  const [activeCloth, setActiveCloth] = useState<Post | null>(null);
  // Multi-select: use selectedItems if provided, otherwise fallback to single activeCloth
  const [selectedClothes, setSelectedClothes] = useState<Post[]>([]);
  const [showKeyHint, setShowKeyHint] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenRequired, setTokenRequired] = useState(1);
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
  const [notification, setNotification] = useState<{ message: string } | null>(null);
  const [modalAction, setModalAction] = useState<'wardrobe' | 'publish' | null>(null);
  const [historyLightbox, setHistoryLightbox] = useState<{ id: string, imageUrl: string, timestamp: number, clothTitle?: string } | null>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  const [animationPrompt, setAnimationPrompt] = useState('');
  const [animationSource, setAnimationSource] = useState<'preset' | 'prompt'>('preset');
  const promptSuggestions = [
    'показ мод',
    'проходка модели',
    'разворот на подиуме',
    'фэшн съемка',
    'дефиле'
  ];

  // Save history to localStorage when it changes (limit to 10 items to avoid quota)
  useEffect(() => {
    try {
      const limitedHistory = generationHistory.slice(0, 10);
      localStorage.setItem('generation_history', JSON.stringify(limitedHistory));
    } catch (e) {
      console.warn('Failed to save history to localStorage:', e);
      // If quota exceeded, clear old history
      localStorage.removeItem('generation_history');
    }
  }, [generationHistory]);

  useEffect(() => {
    if (initialPost) {
      // Enrich with product info from localStorage
      let enrichedPost = { ...initialPost };
      try {
        const productInfoStorage = JSON.parse(localStorage.getItem('wardrobe_product_info') || '{}');
        const productInfo = productInfoStorage[initialPost.imageUrl];
        if (productInfo) {
          enrichedPost = {
            ...initialPost,
            title: productInfo.title || initialPost.title,
            storeUrl: productInfo.storeUrl || (initialPost as any).storeUrl,
          } as Post;
        }
      } catch (e) {
        console.error('Failed to read product info from localStorage:', e);
      }
      setActiveCloth(enrichedPost);
      // Also set to selectedClothes for backward compatibility
      setSelectedClothes([enrichedPost]);
    }
  }, [initialPost]);

  // Sync selectedItems prop to internal state
  useEffect(() => {
    if (selectedItems && selectedItems.length > 0) {
      setSelectedClothes(selectedItems);
      // Set first item as activeCloth for preview
      setActiveCloth(selectedItems[0]);
    }
  }, [selectedItems]);

  useEffect(() => {
    if (activeCloth && !embedded) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeCloth, embedded]);

  // Wardrobe posts: load from API
  const [wardrobePosts, setWardrobePosts] = useState<Post[]>([]);
  const [wardrobeLoading, setWardrobeLoading] = useState(true);

  useEffect(() => {
    const loadWardrobe = async () => {
      setWardrobeLoading(true);
      try {
        const data = await wardrobeApi.getAll();
        if (Array.isArray(data) && data.length > 0) {
          setWardrobePosts(data);
        }
      } catch (e) {
        console.error('Failed to load wardrobe from API:', e);
      } finally {
        setWardrobeLoading(false);
      }
    };

    loadWardrobe();
  }, [initialPost]); // Reload when fitting item changes

  const scenarios = [
    { id: Scenario.WALKING, label: 'Подиум / Дефиле с разворотом' }
  ];

  const handleSelectKey = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setShowKeyHint(false);
    setErrorMessage(null);
  };

  // Compress and convert image to base64 with reduced size
  const compressImage = async (url: string, maxWidth = 1024, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const timeout = setTimeout(() => reject(new Error('Timeout')), 8000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Try to get data - this will throw if canvas is tainted
          try {
            const webp = canvas.toDataURL('image/webp', quality);
            if (webp.startsWith('data:image/webp') && webp.length > 100) {
              resolve(webp.split(',')[1]);
            } else {
              resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
            }
          } catch {
            reject(new Error('Canvas tainted'));
          }
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Load failed'));
      };

      img.src = url;
    });
  };

  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    try {
      // Data URIs - always compress (no CORS)
      if (url.startsWith('data:')) {
        return await compressImage(url, 1024, 0.7);
      }
      // External URLs - try compress, fallback to URL
      try {
        const result = await compressImage(url, 1024, 0.7);
        if (result && result.length > 100) return result;
      } catch (e) {
        console.warn('CORS blocked, using URL:', url.substring(0, 50));
      }
      // Return marker for direct URL usage
      return `URL:${url}`;
    } catch (e) {
      console.error('Image failed:', e);
      return `URL:${url}`;
    }
  };

  const handleGenerate = async (e: React.MouseEvent, scenario: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!activeCloth) return;

    // Token Check Logic
    const cost = (mediaMode === 'video') ? 5 : 1;
    if (user && (user.tokens ?? 0) < cost) {
      setTokenRequired(cost);
      setIsTokenModalOpen(true);
      return;
    }

    // Для видео режима требуется сначала сгенерированное фото
    if (mediaMode === 'video' && !resultUrl) {
      setErrorMessage('Сначала сгенерируйте фото, затем нажмите "Анимировать"');
      return;
    }

    // @ts-ignore
    setSelectedScenario(scenario === 'STUDIO_DEFAULT' ? null : scenario);
    setIsGenerating(true);
    // Для видео не сбрасываем resultUrl — он нужен как startImage, но берем мы его теперь из initialResultUrl или resultUrl
    if (mediaMode !== 'video') {
      setResultUrl(null);
      setInitialResultUrl(null);
    }
    setErrorMessage(null);

    // Default studio prompt for base generation (Urban Fashion style)
    let scenarioPrompt = scenario;

    if (scenario === 'STUDIO_DEFAULT') {
      scenarioPrompt = "Full body shot of a person standing in a bright, minimalist high-end fitting room. The background consists of clean, solid neutral walls with soft architectural lines, no mirrors, no windows, and no text. Bright diffused overhead lighting, clean and airy atmosphere. Professional fashion photography, raw photo, highly detailed fabric and skin texture, 8k resolution, ultra-realistic. Sharp focus on the entire outfit, f/8 aperture, no blur, no bokeh, no plastic skin.";
    }

    try {
      const messagesContent: any[] = [];

      // 0. DEBUG: Verify Input Images
      console.log(`[DEBUG] User References Received: ${userReferences?.length}`);
      if (userReferences?.length === 0) {
        console.warn("[DEBUG] NO USER REFERENCES! The model will use the clothing model's face.");
      }

      // === СПЕЦИАЛЬНАЯ ЛОГИКА ДЛЯ ВИДЕО (VEO) ===
      if (mediaMode === 'video') {
        const sourceImage = initialResultUrl || resultUrl;

        if (sourceImage) {
          console.log('[DEBUG] Video mode: using sourceImage as startImage:', sourceImage);

          // Динамический промт в зависимости от сценария
          let refinedPrompt = animationPrompt.trim();

          if (!refinedPrompt) {
            if (scenario === Scenario.WALKING) {
              refinedPrompt = "Full body shot, professional fashion walk towards the camera. The model walks with a steady, natural gait. At the front, the model performs a smooth, controlled half-turn to the side to showcase the outfit's profile, pauses for a split second, then elegantly executes a seamless 90-degree pivot. Natural weight distribution, fluid movement, neutral posture. Bright minimalist fitting room background, solid light-colored walls, no mirrors, no text. Soft even lighting, 4k, photorealistic, high frame rate.";
            } else {
              // Универсальный вариант для презентации на месте
              refinedPrompt = "Full body shot, fashion lookbook style. A model stands in a neutral, confident pose, then executes a slow, natural 360-degree turn to show the outfit. Realistic weight distribution, smooth foot movement, arms moving naturally by the sides. Brightly lit professional studio, glossy white floor, high-end fashion cinematography, 4k, highly detailed.";
            }
          }
          // Если пользователь ввел свой промт - используем его КАК ЕСТЬ (без добавок), чтобы он мог управлять генерацией полностью.

          // Для видео просто отправляем сгенерированное фото и промт
          messagesContent.push({
            type: "text",
            text: refinedPrompt
          });
          messagesContent.push({
            type: "image_url",
            image_url: { url: sourceImage }
          });

          const messages = [{ role: "user", content: messagesContent }];
          console.log("[DEBUG] Video Messages:", messagesContent.map(m => m.type));

          const data = await generationApi.generateImage({
            model: 'kwaivgi/kling-v2.5-turbo-pro',
            messages: messages
          });

          console.log("Video Backend Response Data:", data);
          const videoUrl = data.result_url || data.choices?.[0]?.message?.video_url;
          if (videoUrl) {
            setResultUrl(videoUrl);
            setIsBaseGenerated(true);
            setGenerationHistory(prev => [{
              id: `gen-video-${Date.now()}`,
              imageUrl: videoUrl,
              timestamp: Date.now(),
              clothTitle: activeCloth?.title || 'Видео'
            }, ...prev].slice(0, 50));
            refreshUser();
          } else {
            throw new Error("No video URL in response");
          }
          setIsGenerating(false);
          return; // Выход из функции — видео сгенерировано
        } else {
          setErrorMessage('Сначала сгенерируйте фото, затем нажмите "Анимировать"');
          setIsGenerating(false);
          return;
        }
      }

      // === ОБЫЧНАЯ ЛОГИКА ДЛЯ ФОТО (NANO-BANANA) ===
      // 1. Context & Person Label
      messagesContent.push({
        type: "text",
        text: "TARGET MODEL (Face & Body Source). Use this person's identity:"
      });

      // 2. Add Target Image(s) based on Mode
      if (generationMode === 'image' && customTargetImage) {
        const imgData = await fetchImageAsBase64(customTargetImage);
        if (imgData) {
          console.log(`[DEBUG] Adding Custom Target Image. Length: ${imgData.length}`);
          const imageUrl = imgData.startsWith('URL:')
            ? imgData.slice(4) // Direct URL
            : `data:image/webp;base64,${imgData}`; // Base64
          messagesContent.push({
            type: "image_url",
            image_url: { url: imageUrl }
          });
        }
      } else if (userReferences && userReferences.length > 0) {
        // Use Promise.all to ensure we await async fetching of images
        await Promise.all(userReferences.slice(0, 3).map(async (ref, index) => {
          try {
            // Force fetch image as base64 to handle both URL and Data URI
            const imgData = await fetchImageAsBase64(ref);
            if (imgData) {
              console.log(`[DEBUG] Processed Avatar ${index + 1}. Length: ${imgData.length}`);
              const imageUrl = imgData.startsWith('URL:')
                ? imgData.slice(4)
                : `data:image/webp;base64,${imgData}`;
              messagesContent.push({
                type: "image_url",
                image_url: { url: imageUrl }
              });
            } else {
              console.warn(`[DEBUG] Failed to process avatar ${index + 1}: empty result`);
            }
          } catch (e) {
            console.error(`[DEBUG] Error processing avatar ${index + 1}`, e);
          }
        }));
      }

      // 3. Clothing Labels and Images (Multi-select support)
      const clothesToUse = selectedClothes.length > 0 ? selectedClothes : (activeCloth ? [activeCloth] : []);

      if (clothesToUse.length === 1) {
        // Single garment - original prompt
        messagesContent.push({
          type: "text",
          text: "GARMENT REFERENCE (Clothing Source ONLY). IGNORE the person in this photo. ONLY look at the clothing:"
        });

        const clothData = await fetchImageAsBase64(clothesToUse[0].imageUrl);
        console.log(`[DEBUG] Adding Cloth Image. Length: ${clothData.length}`);
        const clothUrl = clothData.startsWith('URL:')
          ? clothData.slice(4)
          : `data:image/webp;base64,${clothData}`;
        messagesContent.push({
          type: "image_url",
          image_url: { url: clothUrl }
        });

        // Single garment instruction
        messagesContent.push({
          type: "text",
          text: `GARMENT TYPE/TITLE: ${clothesToUse[0].title || 'Clothing Item'}
          
          INSTRUCTION: Create a high-fidelity, photorealistic image of the TARGET MODEL wearing the GARMENT. 

CLOTHING FIDELITY ANALYSIS:
1. TEXTURE: Conduct a detailed study of the garment's material. Preserve the exact weave, sheen, and fabric weight (e.g., the stiffness of denim, the drape of silk, or the grain of leather).
2. CONSTRUCTION: Maintain all structural elements: precise collar shape, buttons, stitching patterns, zippers, and hemline finish. 
3. FIT & DRAPE: The garment must wrap around the TARGET MODEL's body realistically, creating natural folds and shadows based on their specific physique.
4. ACCURACY: Every logo, print, or unique texture detail from the garment reference must be translated with 8k precision.

CRITICAL IDENTITY RULES:
1. FACE: Must match the TARGET MODEL exactly. No morphing.
2. BODY: Maintain the TARGET MODEL's proportions and skin tone.
3. IGNORE: Completely disregard the identity, hair, and background of the person in the garment reference photo.

ENVIRONMENT: 
Set the scene in a brightly lit, minimalist professional studio/fitting room. Sharp focus, f/8 aperture, deep depth of field, high-end editorial quality.

OUTPUT ONLY THE IMAGE.`
        });
      } else {
        // Multiple garments - combine into one outfit
        messagesContent.push({
          type: "text",
          text: `MULTIPLE GARMENTS TO COMBINE (${clothesToUse.length} items). IGNORE persons in these photos. ONLY look at the clothing items:`
        });

        // Add each garment with label
        for (let i = 0; i < clothesToUse.length; i++) {
          const item = clothesToUse[i];
          messagesContent.push({
            type: "text",
            text: `GARMENT ${i + 1}${item.title ? ` (${item.title})` : ''}:`
          });

          const clothData = await fetchImageAsBase64(item.imageUrl);
          console.log(`[DEBUG] Adding Cloth ${i + 1}. Length: ${clothData.length}`);
          const clothUrl = clothData.startsWith('URL:')
            ? clothData.slice(4)
            : `data:image/webp;base64,${clothData}`;
          messagesContent.push({
            type: "image_url",
            image_url: { url: clothUrl }
          });
        }

        // Multi-garment instruction
        messagesContent.push({
          type: "text",
          text: `INSTRUCTION: Create a high-fidelity, photorealistic image of the TARGET MODEL wearing ALL ${clothesToUse.length} provided GARMENTS combined into ONE cohesive outfit.

CLOTHING FIDELITY ANALYSIS:
1. TEXTURE & HARMONY: Conduct a detailed study of each garment's material. Preserve the exact weave, sheen, and fabric weight. Ensure materials interact realistically (e.g., shirt tucked into pants, jacket over layers).
2. CONSTRUCTION: Maintain all structural elements of every item: precise collars, buttons, stitching patterns, zippers, and finishes.
3. FIT & DRAPE: All garments must wrap around the TARGET MODEL's body realistically, creating natural folds, layering effects, and shadows based on their specific physique.
4. ACCURACY: Every logo, print, or unique texture detail from the garment references must be translated with 8k precision.

CRITICAL IDENTITY RULES:
1. FACE: Must match the TARGET MODEL exactly. No morphing.
2. BODY: Maintain the TARGET MODEL's proportions and skin tone.
3. IGNORE: Completely disregard the identities, hair, and backgrounds of the people in the garment reference photos.

ENVIRONMENT: 
Set the scene in a brightly lit, minimalist professional studio/fitting room. Sharp focus, f/8 aperture, deep depth of field, high-end editorial quality.

OUTPUT ONLY THE IMAGE.`
        });
      }

      const messages = [{ role: "user", content: messagesContent }];
      console.log("[DEBUG] Final Messages Structure:", messagesContent.map(m => m.type));

      // Выбор модели в зависимости от режима (фото/видео)
      // Для фото теперь используем специализированную VTON модель
      const selectedModel = mediaMode === 'video' ? 'kwaivgi/kling-v2.5-turbo-pro' : 'cuuupid/idm-vton';
      console.log(`[DEBUG] Selected Model: ${selectedModel} (mediaMode: ${mediaMode})`);

      // Log payload size for debugging
      const payload = { model: selectedModel, messages: messages };
      const payloadSize = JSON.stringify(payload).length;
      console.log(`[DEBUG] Total Payload Size: ${(payloadSize / 1024 / 1024).toFixed(2)} MB`);

      // Call Backend API
      const data = await generationApi.generateImage({
        model: selectedModel,
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
        setInitialResultUrl(generatedUrl); // Save as base for video
        setIsBaseGenerated(true);
        // Save to history
        setGenerationHistory(prev => [{
          id: `gen-${Date.now()}`,
          imageUrl: generatedUrl,
          timestamp: Date.now(),
          clothTitle: activeCloth?.title || activeCloth?.author
        }, ...prev].slice(0, 50)); // Keep last 50

        // Refresh user tokens
        refreshUser();
      } else if (finishReason === 'IMAGE_OTHER' || (finishReason === 'stop' && !message?.content)) {
        throw new Error("Generation blocked by Safety Filters (IMAGE_OTHER). Try a different photo.");
      } else if (message?.content) {
        // Fallback: Check if markdown image is present in text content
        const content = message.content;
        const match = content.match(/\!\[.*?\]\((.*?)\)/);
        if (match && match[1]) {
          setResultUrl(match[1]);
          setInitialResultUrl(match[1]);
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

  const handleAddToWardrobe = async (productInfo?: { title?: string; storeUrl?: string }) => {
    if (!resultUrl) return;

    try {
      const newItem = await savedLooksApi.add({
        image_url: resultUrl,
        title: productInfo?.title || activeCloth?.title || 'Новый образ',
        brand: 'Virtual Fit',
        store_url: productInfo?.storeUrl
      });

      // Update local state - wardrobePosts is now saved looks
      setWardrobePosts(prev => [newItem, ...prev]);

      if (onSavePost) {
        onSavePost(newItem);
      } else {
        setNotification({ message: 'Образ сохранен в гардероб' });
      }
    } catch (e) {
      console.error('Failed to add to wardrobe:', e);
      setNotification({ message: 'Ошибка: Необходима авторизация' });
    }
  };

  const handlePublish = async (productInfo?: { title?: string; storeUrl?: string }) => {
    if (!resultUrl) return;

    try {
      await postsApi.create({
        image_url: resultUrl,
        title: productInfo?.title || activeCloth?.title || 'Новый образ',
        tags: ['Published', 'Virtual Fit'],
        is_private: false,
        store_url: productInfo?.storeUrl
      });

      setNotification({ message: 'Образ опубликован в ленте' });
    } catch (e) {
      console.error('Failed to publish:', e);
      setNotification({ message: 'Ошибка: Необходима авторизация' });
    }
  };

  const handleModalConfirm = (data: { title?: string; storeUrl?: string }) => {
    if (modalAction === 'wardrobe') {
      handleAddToWardrobe(data);
    } else if (modalAction === 'publish') {
      handlePublish(data);
    }
    setModalAction(null);
  };

  // History item actions
  const handleHistoryAddToWardrobe = async (item: { id: string, imageUrl: string, clothTitle?: string }) => {
    try {
      const newItem = await savedLooksApi.add({
        image_url: item.imageUrl,
        title: item.clothTitle || 'Образ из истории',
        brand: 'Virtual Fit',
      });
      setWardrobePosts(prev => [newItem, ...prev]);
      setNotification({ message: 'Добавлено в гардероб' });
      setHistoryLightbox(null);
    } catch (e) {
      console.error('Failed to add to wardrobe:', e);
      setNotification({ message: 'Ошибка: Необходима авторизация' });
    }
  };

  const handleHistoryPublish = async (item: { id: string, imageUrl: string, clothTitle?: string }) => {
    try {
      await postsApi.create({
        image_url: item.imageUrl,
        title: item.clothTitle || 'Образ из истории',
        tags: ['Published', 'Virtual Fit'],
        is_private: false,
      });
      setNotification({ message: 'Опубликовано в ленте' });
      setHistoryLightbox(null);
    } catch (e) {
      console.error('Failed to publish:', e);
      setNotification({ message: 'Ошибка: Необходима авторизация' });
    }
  };

  const handleHistoryUseAsResult = (item: { id: string, imageUrl: string }) => {
    setResultUrl(item.imageUrl);
    setInitialResultUrl(item.imageUrl); // Allow using history item as base for video
    setIsBaseGenerated(true);
    setHistoryLightbox(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setActiveCloth({
          id: `c-${Date.now()}`,
          imageUrl: reader.result as string,
          isPrivate: true,
          tags: []
        });
        setSelectedClothes([]); // Clear multi-select to prioritize upload
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
        setGenerationMode('image'); // Switch to custom image mode
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
          isPrivate: true,
          tags: []
        });
        setSelectedClothes([]); // Clear multi-select to prioritize upload
        setResultUrl(null);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleActiveClothUrl = (url: string) => {
    setActiveCloth({
      id: `c-${Date.now()}`,
      imageUrl: url,
      isPrivate: true,
      tags: []
    });
    setSelectedClothes([]); // Clear multi-select to prioritize upload
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
              {(resultUrl || activeCloth || customTargetImage || isGenerating) && (
                <>
                  {/* Проверяем, является ли resultUrl видео */}
                  {resultUrl && (resultUrl.endsWith('.mp4') || resultUrl.includes('/v/')) ? (
                    <video
                      src={resultUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                      className={`w-full h-full object-contain transition-all duration-700 ${isGenerating ? 'blur-md scale-95 opacity-50' : 'scale-100 opacity-100'}`}
                    />
                  ) : (
                    <img
                      src={resultUrl || (generationMode === 'image' ? customTargetImage : activeCloth?.imageUrl) || "/mock/mock_avatar_full_001.jpg"}
                      className={`w-full h-full object-contain transition-all duration-700 ${isGenerating ? 'blur-md scale-95 opacity-50' : 'scale-100 opacity-100'}`}
                    />
                  )}
                </>
              )}
            </div>

            {/* Hint Overlay if no activity */}
            {!resultUrl && !activeCloth && !customTargetImage && !isGenerating && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center cursor-default pointer-events-none">
                <div className="bg-white/80 backdrop-blur-md px-8 py-6 rounded-3xl shadow-sm border border-white/60 animate-in fade-in zoom-in duration-700 max-w-md text-center">
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-base font-bold text-gray-900">
                      Как сделать генерацию?
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black leading-relaxed">
                      выбери изображение из&nbsp;блока Примерочная, или Рекомендаций
                    </p>
                  </div>
                </div>
              </div>
            )}

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

            {/* MODE SELECTION - ALWAYS VISIBLE */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Выберите режим</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setGenerationMode('avatar')}
                  className={`flex-1 rounded-[24px] p-4 flex flex-col items-center justify-center gap-2 transition-all border ${generationMode === 'avatar' ? 'bg-black text-white border-black' : 'bg-gray-50 text-black border-gray-100 hover:border-black'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-transform ${generationMode === 'avatar' ? 'bg-white/20' : 'bg-white'}`}>
                    <svg className={`w-5 h-5 ${generationMode === 'avatar' ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest">На основе Аватара</span>
                </button>
                <button
                  onClick={() => setGenerationMode('image')}
                  className={`flex-1 rounded-[24px] p-4 flex flex-col items-center justify-center gap-2 transition-all border ${generationMode === 'image' ? 'bg-black text-white border-black' : 'bg-gray-50 text-black border-gray-100 hover:border-black'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-transform ${generationMode === 'image' ? 'bg-white/20' : 'bg-white'}`}>
                    <svg className={`w-5 h-5 ${generationMode === 'image' ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest">На основе Фото</span>
                </button>
              </div>
            </div>

            {/* RESET & RETRY BUTTONS - Visible after generation */}
            {resultUrl && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => {
                    setResultUrl(null);
                    setInitialResultUrl(null);
                    setIsBaseGenerated(false);
                    setActiveCloth(null);
                    setSelectedClothes([]);
                    setCustomTargetImage(null);
                    setGenerationMode(null);
                  }}
                  className="flex-1 py-3 bg-gray-100 text-black rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  Сбросить
                </button>
                <button
                  onClick={(e) => handleGenerate(e, 'STUDIO_DEFAULT')}
                  disabled={isGenerating}
                  className="flex-1 py-3 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? 'Загрузка' : 'Повторить'}
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
                onUrl={(url) => { setCustomTargetImage(url); setGenerationMode('image'); }}
                isDragging={isDragging}
                onDragEnter={handleDrag(setIsDragging)}
                onDragLeave={handleDrag(setIsDragging)}
                onDragOver={handleDrag(setIsDragging)}
                onDrop={(e: React.DragEvent) => { createDropHandler(setCustomTargetImage)(e); setGenerationMode('image'); }}
              />
            )}


            {/* IF BASE NOT GENERATED: SHOW 'TRY ON' BUTTON */}
            {generationMode && !isBaseGenerated && (
              <div className="flex flex-col flex-shrink-0 animate-in fade-in slide-in-from-top-2">
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

                <div className="flex items-center justify-between mb-4 mt-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center flex-1">
                    Шаг 1: Примерка
                  </p>
                </div>

                {generationMode === 'avatar' && avatars && avatars.length > 0 && (
                  <div className="mb-6 animate-in fade-in slide-in-from-right-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Модель</p>
                    <div className="flex items-center gap-4 overflow-x-auto p-4 -m-2 scrollbar-none snap-x">
                      {avatars.map(av => (
                        <button
                          key={av.id}
                          onClick={() => onSetActiveAvatar && onSetActiveAvatar(av.id)}
                          className={`flex flex-col items-center gap-1 flex-shrink-0 transition-all snap-start ${activeAvatarId === av.id ? 'scale-110' : 'opacity-70 hover:opacity-100'}`}
                          title={av.name}
                        >
                          <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${activeAvatarId === av.id ? 'border-black shadow-md ring-2 ring-white' : 'border-gray-100 grayscale hover:grayscale-0'}`}>
                            {(av.generatedAvatarUrl || av.referenceImages[0]) ? (
                              <img src={av.generatedAvatarUrl || av.referenceImages[0]} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <span className="text-[8px] font-bold">{av.name[0]}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500 max-w-12 truncate">{av.name}</span>
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
                    {isGenerating ? 'Примерка...' : (
                      <span className="flex items-center gap-2">
                        Надеть {user && (
                          <>
                            <span className="opacity-50">/</span>
                            <span className="flex items-center gap-1">1 <TokenIcon className="w-3 h-3 text-yellow-500" /></span>
                          </>
                        )}
                      </span>
                    )}
                  </button>
                  <p className="text-[9px] text-gray-300 text-center leading-relaxed">
                    Сначала мы создадим базовый образ, а затем вы сможете выбрать сценарий.
                  </p>
                </div>
              </div>
            )}

            {/* SCENARIOS - ALWAYS VISIBLE (BELOW STEP 1) */}
            <div className={`flex flex-col gap-2 mt-4 transition-all duration-500 ${!generationMode ? '' : ''}`}>
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



              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-2 animate-in fade-in">
                {mediaMode === 'photo' ? 'Сценарии' : 'Настройка анимации'}
              </h3>

              <div className="flex flex-col gap-3 animate-in fade-in">
                {mediaMode === 'photo' ? (
                  /* Photo mode: preset scenarios */
                  <>
                    {scenarios.map(s => (
                      <button
                        key={s.id}
                        disabled={!activeCloth || isGenerating}
                        onClick={(e) => handleGenerate(e, s.id)}
                        className={`w-full py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedScenario === s.id ? 'bg-white text-black scale-[1.03]' : 'bg-black text-white hover:bg-zinc-800'
                          } disabled:opacity-20`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {s.label}
                          {user && (
                            <>
                              <span className="opacity-50">/</span>
                              {user.daily_generations_count < 10 ? 'Бесплатно' : (
                                <span className="flex items-center gap-1">1 <TokenIcon className="w-3 h-3 text-yellow-500" /></span>
                              )}
                            </>
                          )}
                        </span>
                      </button>
                    ))}
                  </>
                ) : (
                  /* Video mode: Hybrid UI */
                  <>
                    {/* Source Toggle */}
                    <div className="flex p-1 bg-gray-100 rounded-full mb-2">
                      <button
                        onClick={() => setAnimationSource('preset')}
                        className={`flex-1 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${animationSource === 'preset' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Шаблоны
                      </button>
                      <button
                        onClick={() => setAnimationSource('prompt')}
                        className={`flex-1 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${animationSource === 'prompt' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Свой промт
                      </button>
                    </div>

                    {animationSource === 'preset' ? (
                      /* Presets List */
                      scenarios.map(s => (
                        <button
                          key={s.id}
                          disabled={!activeCloth || isGenerating}
                          onClick={(e) => handleGenerate(e, s.id)}
                          className={`w-full py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedScenario === s.id ? 'bg-white text-black scale-[1.03]' : 'bg-black text-white hover:bg-zinc-800'
                            } disabled:opacity-20`}
                        >
                          <span className="flex items-center justify-center gap-2">
                            {s.label}
                            {user && (
                              <>
                                <span className="opacity-50">/</span>
                                <span className="flex items-center gap-1">5 <TokenIcon className="w-3 h-3 text-yellow-500" /></span>
                              </>
                            )}
                          </span>
                        </button>
                      ))
                    ) : (
                      /* Custom Prompt UI */
                      <>
                        <textarea
                          value={animationPrompt}
                          onChange={(e) => setAnimationPrompt(e.target.value)}
                          placeholder="Опишите действие, например: идёт по подиуму и улыбается..."
                          className="w-full h-24 bg-white border border-gray-200 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:border-black transition-colors placeholder:text-gray-400"
                        />
                        {/* Prompt suggestions */}
                        <div className="flex flex-wrap gap-2">
                          {promptSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => setAnimationPrompt(prev => prev ? `${prev}, ${suggestion}` : suggestion)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-[10px] font-medium transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                        {/* Generate button */}
                        <button
                          disabled={!activeCloth || isGenerating || !animationPrompt.trim()}
                          onClick={(e) => handleGenerate(e, 'CUSTOM_ANIMATION')}
                          className="w-full py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 disabled:opacity-30 hover:bg-zinc-800 mt-2"
                        >
                          {isGenerating ? 'Создаётся...' : (
                            <span className="flex items-center gap-2">
                              ✨ Создать анимацию
                              {user && (
                                <>
                                  <span className="opacity-50">/</span>
                                  <span className="flex items-center gap-1">5 <TokenIcon className="w-3 h-3 text-yellow-500" /></span>
                                </>
                              )}
                            </span>
                          )}
                        </button>
                      </>
                    )}
                  </>
                )}

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
                      onClick={() => setModalAction('wardrobe')}
                      className="flex-1 py-3 bg-white border border-black/10 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      В гардероб
                    </button>
                    <button
                      onClick={() => setModalAction('publish')}
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
            </div>
          </div>

          {/* Selected Items Preview - Multi-select support */}
          {selectedClothes.length > 0 && (
            <div className="liquid-glass p-4 rounded-[24px] border border-white mt-4 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  Выбрано вещей: {selectedClothes.length}
                </p>
                <button
                  onClick={() => { setSelectedClothes([]); setActiveCloth(null); setResultUrl(null); setIsBaseGenerated(false); }}
                  className="text-[8px] font-bold uppercase tracking-widest text-red-400 hover:text-red-500 transition-colors"
                >
                  Очистить
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto p-2">
                {selectedClothes.map((item, index) => (
                  <div key={item.id} className="relative shrink-0 group">
                    <div className="w-16 h-20 rounded-xl overflow-hidden bg-gray-100">
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -top-1 -left-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      {index + 1}
                    </div>
                    {item.title && (
                      <p className="text-[8px] text-gray-500 mt-1 w-16 truncate text-center">{item.title}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div >

      {/* Wardrobe - only show when not embedded (HomeView has its own) */}
      {
        !embedded && (
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
                        onClick={() => setHistoryLightbox(item)}
                        className="relative group cursor-pointer rounded-[20px] overflow-hidden aspect-[3/4] bg-gray-100 border-2 border-transparent hover:border-black transition-all"
                      >
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                          <svg className="w-8 h-8 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                          <p className="text-[9px] text-white font-bold uppercase tracking-widest">
                            {new Date(item.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                          </p>
                          {item.clothTitle && (
                            <p className="text-[8px] text-white/70 mt-1 px-2 text-center truncate max-w-full">{item.clothTitle}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
              {wardrobeLoading ? (
                <div className="col-span-full flex justify-center py-20">
                  <div className="w-8 h-8 border-2 border-black rounded-full animate-spin border-t-transparent"></div>
                </div>
              ) : wardrobePosts.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center text-center px-8 py-12 bg-gray-50 rounded-[32px]">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Здесь пока ничего нет</h3>
                  <p className="text-sm text-gray-500 max-w-md leading-relaxed">
                    После генерации нажмите «В гардероб», чтобы сохранить результат сюда.
                  </p>
                </div>
              ) : (
                wardrobePosts.map(post => (
                  <div key={post.id}>
                    <PostCard post={post} onClick={setActiveCloth} onAuthorClick={onNavigateToProfile} hideActions={true} />
                  </div>
                ))
              )}
            </div>
          </div >
        )
      }


      {notification && (
        <Notification
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <InsufficientTokensModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        required={tokenRequired}
        available={user?.tokens ?? 0}
        onBuyTokens={() => {
          setIsTokenModalOpen(false);
          if (onNavigateSubscription) onNavigateSubscription();
        }}
      />

      {modalAction && (
        <ProductInfoModal
          action={modalAction}
          onConfirm={handleModalConfirm}
          onClose={() => setModalAction(null)}
        />
      )}

      {/* History Lightbox */}
      {
        historyLightbox && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setHistoryLightbox(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setHistoryLightbox(null)}
              className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content container */}
            <div
              className="relative flex flex-col md:flex-row items-center gap-6 max-w-5xl w-full animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              <div className="flex-1 max-h-[75vh]">
                <img
                  src={historyLightbox.imageUrl}
                  alt="Генерация"
                  className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
                />
              </div>

              {/* Actions panel */}
              <div className="flex flex-col gap-3 w-full md:w-64 bg-white/10 backdrop-blur-md rounded-2xl p-4">
                <div className="text-center mb-2">
                  <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Дата генерации</p>
                  <p className="text-white font-bold">
                    {new Date(historyLightbox.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  {historyLightbox.clothTitle && (
                    <p className="text-white/70 text-sm mt-1">{historyLightbox.clothTitle}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleHistoryAddToWardrobe(historyLightbox)}
                    className="flex-1 py-3 bg-white border border-black/10 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    В гардероб
                  </button>
                  <button
                    onClick={() => handleHistoryPublish(historyLightbox)}
                    className="flex-1 py-3 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Опубликовать
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(historyLightbox.imageUrl);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `fitting-room-${Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } catch (e) { console.error("Download failed", e); }
                    }}
                    className="flex-1 py-3 bg-white border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    Скачать
                  </button>
                  <button
                    onClick={async () => {
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: 'Примерочная AI',
                            text: 'Посмотрите, какой образ я создал!',
                            url: historyLightbox.imageUrl
                          });
                        } catch (e) { console.error("Share failed", e); }
                      }
                    }}
                    className="flex-1 py-3 bg-white border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    Поделиться
                  </button>
                </div>
              </div>
            </div>

            {/* Hint text */}
            <p className="absolute bottom-4 text-white/40 text-[10px] font-medium uppercase tracking-widest">
              Нажмите на фон для закрытия
            </p>
          </div>
        )
      }
    </div >
  );
};

export default VirtualFitView;
