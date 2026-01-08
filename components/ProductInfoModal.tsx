import React, { useState } from 'react';

interface ProductInfoModalProps {
    action: 'wardrobe' | 'publish';
    onConfirm: (data: { title?: string; storeUrl?: string }) => void;
    onClose: () => void;
}

const ProductInfoModal: React.FC<ProductInfoModalProps> = ({ action, onConfirm, onClose }) => {
    const [title, setTitle] = useState('');
    const [storeUrl, setStoreUrl] = useState('');

    const handleSkip = () => {
        onConfirm({});
    };

    const handleSave = () => {
        onConfirm({
            title: title.trim() || undefined,
            storeUrl: storeUrl.trim() || undefined
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold mb-2 text-center">
                    {action === 'wardrobe' ? 'Сохранить в гардероб' : 'Опубликовать образ'}
                </h3>
                <p className="text-sm text-gray-500 text-center mb-6">
                    Добавьте информацию о товаре (необязательно)
                </p>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                            Название товара
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Например: Платье летнее"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                            Ссылка на товар
                        </label>
                        <input
                            type="url"
                            value={storeUrl}
                            onChange={(e) => setStoreUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleSkip}
                        className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        Пропустить
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim() && !storeUrl.trim()}
                        className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-black text-white hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Сохранить
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ProductInfoModal;
