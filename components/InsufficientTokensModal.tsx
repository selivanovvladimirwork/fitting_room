import React from 'react';
import { TokenIcon } from './TokenIcon';

interface InsufficientTokensModalProps {
    isOpen: boolean;
    onClose: () => void;
    required: number;
    available: number;
    onBuyTokens: () => void;
}

const InsufficientTokensModal: React.FC<InsufficientTokensModalProps> = ({ isOpen, onClose, required, available, onBuyTokens }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <TokenIcon className="w-10 h-10 text-yellow-500" />
                    </div>

                    <h2 className="text-2xl font-bold text-black mb-4 uppercase tracking-tight">Недостаточно токенов</h2>

                    <p className="text-gray-500 mb-8 leading-relaxed">
                        Для выполнения этого действия требуется <span className="text-black font-bold">{required} <TokenIcon className="w-3 h-3 inline pb-0.5" /></span>.
                        <br />
                        На вашем балансе сейчас <span className="text-black font-bold">{available} <TokenIcon className="w-3 h-3 inline pb-0.5" /></span>.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onBuyTokens}
                            className="w-full py-4 bg-black text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Пополнить баланс
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-white text-gray-400 rounded-full text-sm font-bold uppercase tracking-widest hover:text-black transition-all"
                        >
                            Позже
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 py-4 px-8 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] text-center">
                        1 фото = 1 токен | 1 видео = 5 токенов
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InsufficientTokensModal;
