
import React, { useState } from 'react';

import { useAuth } from '../context/AuthContext';

interface SettingsViewProps {
  onBack: () => void;
  embedded?: boolean;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, embedded = false }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    nickname: user?.nickname || '',
    email: user?.email || '',
    phone: '',
  });

  // Update form data when user loads
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name,
        nickname: user.nickname,
        email: user.email
      }));
    }
  }, [user]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setIsSaving(true);

    // Simulate saving settings (backend connection would be here)

    setTimeout(() => {
      setIsSaving(false);
      if (!embedded) onBack();
    }, 1500);
  };

  return (
    <div className={`w-full pb-12 pt-16 px-2 md:px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 ${embedded ? 'py-0 px-0 md:px-0' : ''}`}>
      {/* Header with Back button - only show if not embedded */}
      {!embedded && (
        <div className="flex items-center gap-6 mb-16 px-4">
          <button
            onClick={onBack}
            className="w-10 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white rounded-[30px] md:rounded-full shadow-sm border border-gray-50 hover:scale-110 active:scale-95 transition-all hover:shadow-lg"
          >
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-3xl md:text-6xl font-thin tracking-widest uppercase flex-grow text-center md:text-left">Настройки</h2>
        </div>
      )}

      <div className="liquid-glass rounded-[40px] md:rounded-[60px] p-8 md:p-24 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">

          {/* Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] ml-6">Имя</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-8 md:px-10 py-5 md:py-6 bg-white/50 rounded-full text-lg md:text-xl font-light tracking-tight focus:outline-none focus:ring-8 focus:ring-black/5 transition-all border border-transparent focus:border-white shadow-lg"
              placeholder="Введите ваше имя"
            />
          </div>

          {/* Nickname */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] ml-6">Никнейм</label>
            <div className="relative">
              <span className="absolute left-8 md:left-10 top-1/2 -translate-y-1/2 text-gray-400 text-lg md:text-xl">@</span>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full pl-14 md:pl-16 pr-8 py-5 md:py-6 bg-white/50 rounded-full text-lg md:text-xl font-light tracking-tight focus:outline-none focus:ring-8 focus:ring-black/5 transition-all border border-transparent focus:border-white shadow-lg"
                placeholder="ник"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] ml-6">E-mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-8 md:px-10 py-5 md:py-6 bg-white/50 rounded-full text-lg md:text-xl font-light tracking-tight focus:outline-none focus:ring-8 focus:ring-black/5 transition-all border border-transparent focus:border-white shadow-lg"
              placeholder="example@mail.com"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] ml-6">Телефон</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-8 md:px-10 py-5 md:py-6 bg-white/50 rounded-full text-lg md:text-xl font-light tracking-tight focus:outline-none focus:ring-8 focus:ring-black/5 transition-all border border-transparent focus:border-white shadow-lg"
              placeholder="+7 (000) 000-00-00"
            />
          </div>


        </div>

        {/* Save Button */}
        <div className="mt-16 md:mt-24 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full md:w-auto px-12 md:px-20 py-6 md:py-7 bg-black text-white rounded-full text-[12px] font-bold tracking-[0.3em] uppercase transition-all duration-300 shadow-xl flex items-center justify-center gap-6 ${isSaving ? 'opacity-50 scale-95' : 'hover:scale-105 active:scale-95 hover:shadow-2xl'
              }`}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Сохранение
              </>
            ) : (
              'Сохранить изменения'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
