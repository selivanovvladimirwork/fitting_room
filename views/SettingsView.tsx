
import React, { useState } from 'react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface SettingsViewProps {
  onBack: () => void;
  embedded?: boolean;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, embedded = false }) => {
  const { user, refreshUser } = useAuth();

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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await authApi.updateProfile({
        name: formData.fullName,
        nickname: formData.nickname
      });
      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (!embedded) onBack();
      }, 1500);
    } catch (error: any) {
      console.error('Save error:', error);
      setSaveError(error.message || 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">

          {/* Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-5">Имя</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-6 md:px-8 py-3 md:py-4 bg-white/50 rounded-full text-sm md:text-base font-medium tracking-tight focus:outline-none focus:ring-4 focus:ring-black/5 transition-all border border-transparent focus:border-white shadow-sm hover:shadow-md"
              placeholder="Введите ваше имя"
            />
          </div>

          {/* Nickname */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-5">Никнейм</label>
            <div className="relative">
              <span className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-gray-400 text-sm md:text-base">@</span>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full pl-10 md:pl-14 pr-6 py-3 md:py-4 bg-white/50 rounded-full text-sm md:text-base font-medium tracking-tight focus:outline-none focus:ring-4 focus:ring-black/5 transition-all border border-transparent focus:border-white shadow-sm hover:shadow-md"
                placeholder="ник"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-5">E-mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-6 md:px-8 py-3 md:py-4 bg-white/50 rounded-full text-sm md:text-base font-medium tracking-tight focus:outline-none focus:ring-4 focus:ring-black/5 transition-all border border-transparent focus:border-white shadow-sm hover:shadow-md"
              placeholder="example@mail.com"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-5">Телефон</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-6 md:px-8 py-3 md:py-4 bg-white/50 rounded-full text-sm md:text-base font-medium tracking-tight focus:outline-none focus:ring-4 focus:ring-black/5 transition-all border border-transparent focus:border-white shadow-sm hover:shadow-md"
              placeholder="+7 (000) 000-00-00"
            />
          </div>


        </div>

        {/* Error Message */}
        {saveError && (
          <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-2xl text-center text-sm font-medium">
            {saveError}
          </div>
        )}

        {/* Success Message */}
        {saveSuccess && (
          <div className="mt-8 p-4 bg-green-50 text-green-600 rounded-2xl text-center text-sm font-medium flex items-center justify-center gap-2">
            ✓ Изменения сохранены
          </div>
        )}

        {/* Save Button */}
        <div className="mt-16 md:mt-24 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full md:w-auto px-10 md:px-12 py-4 md:py-5 bg-black text-white rounded-full text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-lg flex items-center justify-center gap-4 ${isSaving ? 'opacity-50 scale-95' : 'hover:scale-105 active:scale-95 hover:shadow-xl'
              }`}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Сохранение
              </>
            ) : saveSuccess ? (
              '✓ Сохранено'
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
