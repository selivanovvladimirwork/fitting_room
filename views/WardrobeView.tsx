import React, { useState } from 'react';
import { Post } from '../types';

interface WardrobeViewProps {
    onBack: () => void;
}

const WardrobeView: React.FC<WardrobeViewProps> = ({ onBack }) => {
    const [activeFolder, setActiveFolder] = useState<string | null>(null);

    // Mock Folders
    const folders = [
        { id: 'winter', label: 'Зима', count: 12, cover: 'https://picsum.photos/seed/winter/400/600' },
        { id: 'sport', label: 'Спорт', count: 5, cover: 'https://picsum.photos/seed/sport/400/600' },
        { id: 'office', label: 'Офис', count: 8, cover: 'https://picsum.photos/seed/office/400/600' },
        { id: 'date', label: 'Свидание', count: 3, cover: 'https://picsum.photos/seed/date/400/600' },
    ];

    // Mock Items
    const items = Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        url: `https://picsum.photos/seed/wardrobe_item${i}/600/800`,
        liked: i % 3 === 0
    }));

    const renderFolders = () => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {folders.map(folder => (
                <div
                    key={folder.id}
                    onClick={() => setActiveFolder(folder.id)}
                    className="group cursor-pointer"
                >
                    <div className="aspect-[3/4] rounded-[24px] overflow-hidden relative mb-3 shadow-sm group-hover:shadow-md transition-all">
                        {/* Stack effect */}
                        <div className="absolute top-2 right-2 w-full h-full bg-gray-200 rounded-[24px] -z-10 translate-x-1 translate-y-1"></div>
                        <div className="absolute top-4 right-4 w-full h-full bg-gray-100 rounded-[24px] -z-20 translate-x-2 translate-y-2"></div>

                        <img src={folder.cover} alt={folder.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all flex items-center justify-center">
                            <span className="text-white font-bold text-xl drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500">
                                Открыть
                            </span>
                        </div>
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 ml-1">{folder.label}</h3>
                    <p className="text-xs text-gray-400 ml-1 font-medium">{folder.count} образов</p>
                </div>
            ))}
        </div>
    );

    const renderGrid = () => (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <button
                onClick={() => setActiveFolder(null)}
                className="mb-8 flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors font-medium px-4 py-2 hover:bg-gray-100 rounded-full w-fit"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                Назад к папкам
            </button>

            <div className="flex items-end justify-between mb-6 px-1">
                <h2 className="text-3xl font-thin tracking-tight capitalize">{folders.find(f => f.id === activeFolder)?.label}</h2>
                <span className="text-gray-400 text-sm">Нажмите для просмотра</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map(item => (
                    <div key={item.id} className="group relative aspect-[3/4] rounded-[20px] overflow-hidden cursor-zoom-in">
                        <img src={item.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                            <button className="w-full py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                                В Instagram
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            <div className="mb-10 flex items-center justify-between">
                <h1 className="text-4xl md:text-5xl font-thin tracking-tight text-gray-900">Ваш Гардероб</h1>
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {!activeFolder ? renderFolders() : renderGrid()}

            {/* Helper text from screenshot */}
            <p className="mt-12 text-center text-gray-400 text-xs max-w-lg mx-auto leading-relaxed">
                *Фото образов гардероба можно группировать, давая им названия (Зима, Спорт).
                При нажатии на группы фото открывается сетка фотокарточек.
                Нажатие на каждую увеличивает её в размере.
            </p>
        </div>
    );
};

export default WardrobeView;
