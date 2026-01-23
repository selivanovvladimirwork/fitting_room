import React from 'react';

interface NotFoundViewProps {
    onBack: () => void;
}

const NotFoundView: React.FC<NotFoundViewProps> = ({ onBack }) => {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-8">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-4">404</h1>
            <p className="text-lg md:text-xl text-gray-500 mb-2">Страница не найдена</p>
            <p className="text-sm text-gray-400 max-w-md mb-8">
                Возможно, страница была удалена или вы перешли по неверной ссылке.
            </p>

            <button
                onClick={onBack}
                className="bg-black text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                На главную
            </button>
        </div>
    );
};

export default NotFoundView;
