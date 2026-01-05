import React, { useEffect } from 'react';

interface NotificationProps {
    message: string;
    onAction?: () => void;
    actionLabel?: string;
    onClose: () => void;
    duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ message, onAction, actionLabel, onClose, duration = 4000 }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] rounded-[24px] px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-sm font-bold text-black leading-tight">
                        {message}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {onAction && actionLabel && (
                        <button
                            onClick={() => {
                                onAction();
                                onClose();
                            }}
                            className="px-4 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 transition-colors shrink-0"
                        >
                            {actionLabel}
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-black transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Notification;
