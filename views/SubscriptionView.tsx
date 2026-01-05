
import React, { useState } from 'react';

interface SubscriptionViewProps {
  onBack: () => void;
}

const SubscriptionView: React.FC<SubscriptionViewProps> = ({ onBack }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>('pro');
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Базовый',
      price: 'Бесплатно',
      description: 'Для знакомства с AI-модой',
      features: ['1 Цифровой двойник', '10 примерок в день', 'Низкое разрешение', 'Базовые сценарии'],
      buttonText: 'Ваш текущий план',
      isPopular: false
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '1 490 ₽',
      period: '/ месяц',
      description: 'Лучший выбор для контент-мейкеров',
      features: ['Безлимитные двойники', 'HD видео (Google Veo)', 'Все 4 сценария ходьбы', 'Приоритетная генерация', 'Visual Search поиск'],
      buttonText: 'Выбрать Pro',
      isPopular: true
    },
    {
      id: 'elite',
      name: 'Elite',
      price: '4 990 ₽',
      period: '/ месяц',
      description: 'Для профессиональных брендов',
      features: ['4K видео генерация', 'API доступ', 'Персональный LoRA тюнинг', 'Скрытые водяные знаки', 'Ранний доступ к фичам'],
      buttonText: 'Стать Elite',
      isPopular: false
    }
  ];

  const handleSubscribe = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      alert('Перенаправление на шлюз оплаты...');
    }, 1500);
  };

  return (
    <div className="w-full py-12 px-2 md:px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Header */}
      <div className="flex items-center gap-6 mb-16 px-4">
        <button
          onClick={onBack}
          className="w-10 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white rounded-[30px] md:rounded-full shadow-sm border border-gray-50 hover:scale-110 active:scale-95 transition-all hover:shadow-lg"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-3xl md:text-6xl font-thin tracking-widest uppercase flex-grow text-center md:text-left">Подписка</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative p-8 md:p-12 rounded-[40px] md:rounded-[60px] border transition-all duration-500 cursor-pointer flex flex-col ${selectedPlan === plan.id
              ? 'liquid-glass border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] scale-[1.03]'
              : 'bg-white/30 border-gray-100 hover:border-gray-200 hover:scale-102'
              }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 md:px-8 py-2 md:py-2.5 bg-black text-white text-[9px] md:text-[10px] font-bold uppercase tracking-[0.4em] rounded-full shadow-lg">
                Популярный
              </div>
            )}

            <div className="mb-10 md:mb-12 text-center">
              <h3 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-4 md:mb-6">{plan.name}</h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl md:text-5xl font-light tracking-tight text-black">{plan.price}</span>
                {plan.period && <span className="text-sm md:text-base text-gray-400 font-light">{plan.period}</span>}
              </div>
              <p className="mt-4 md:mt-6 text-xs md:text-sm text-gray-400 font-light leading-relaxed max-w-xs mx-auto">{plan.description}</p>
            </div>

            <div className="space-y-4 md:space-y-6 mb-12 md:mb-16 flex-grow">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="mt-1 w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full bg-black/5 shrink-0">
                    <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[12px] md:text-[13px] font-light text-gray-600 leading-tight">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); handleSubscribe(); }}
              disabled={plan.id === 'basic'}
              className={`w-full py-5 md:py-6 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-300 ${plan.id === 'basic'
                ? 'bg-gray-50 text-gray-300 cursor-default'
                : selectedPlan === plan.id
                  ? 'bg-black text-white shadow-xl hover:scale-105 active:scale-95'
                  : 'bg-white text-black border border-gray-100 hover:scale-105 hover:shadow-lg active:scale-95'
                }`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Methods Footer */}
      <div className="mt-20 md:mt-32 px-4">
        <div className="liquid-glass rounded-[40px] md:rounded-[60px] p-10 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16 border-white/60">
          <div className="text-center md:text-left">
            <h4 className="text-2xl md:text-3xl font-light mb-4">Безопасная оплата</h4>
            <p className="text-sm md:text-base text-gray-400 font-light max-w-md">Мы поддерживаем все популярные платежные системы РФ для мгновенного доступа к AI-функциям</p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20">
            {/* MIR Logo */}
            <div className="flex flex-col items-center gap-4 md:gap-5 grayscale hover:grayscale-0 opacity-40 hover:opacity-100 transition-all cursor-pointer hover:scale-110">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/Mir-logo.svg" alt="MIR" className="h-5 md:h-6" />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400">МИР</span>
            </div>
            {/* SberPay Logo */}
            <div className="flex flex-col items-center gap-4 md:gap-5 grayscale hover:grayscale-0 opacity-40 hover:opacity-100 transition-all cursor-pointer hover:scale-110">
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Sberbank_Logo_2020.svg" alt="Sber" className="h-6 md:h-8" />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400">СберПэй</span>
            </div>
            {/* T-Bank Logo */}
            <div className="flex flex-col items-center gap-4 md:gap-5 grayscale hover:grayscale-0 opacity-40 hover:opacity-100 transition-all cursor-pointer hover:scale-110">
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/7a/Tinkoff_Logo_2024.svg" alt="T-Bank" className="h-6 md:h-8" />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400">Т-Банк</span>
            </div>
            {/* SBP Logo */}
            <div className="flex flex-col items-center gap-4 md:gap-5 grayscale hover:grayscale-0 opacity-40 hover:opacity-100 transition-all cursor-pointer hover:scale-110">
              <img src="https://upload.wikimedia.org/wikipedia/commons/1/1a/SBP_logo.svg" alt="SBP" className="h-8 md:h-10" />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400">QR-код</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionView;
