
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentApi, authApi } from '../services/api';
import { SubscriptionPlan, TokenPackage } from '../types';
import { TokenIcon } from '../components/TokenIcon';
import { SlidingTabs } from '../components/SlidingTabs';

interface SubscriptionViewProps {
  onBack: () => void;
}

const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: 1,
    name: 'БАЗОВЫЙ',
    price: 0,
    period: 'month',
    features: ['1 Цифровой двойник', 'Базовые сценарии'],
    photos_per_day: 10
  },
  {
    id: 2,
    name: 'PROFESSIONAL',
    price: 449,
    period: 'month',
    features: ['Безлимитные двойники', 'Ранний доступ к фичам'],
    photos_per_day: 50
  },
  {
    id: 3,
    name: 'ELITE',
    price: 990,
    period: 'month',
    features: ['Приоритетная генерация', 'Ранний доступ к фичам'],
    photos_per_day: 200
  }
];

const SubscriptionView: React.FC<SubscriptionViewProps> = ({ onBack }) => {
  const { user, refreshUser, isAuthenticated, openAuthModal } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(MOCK_PLANS);
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'tokens'>('plans');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [, packagesData] = await Promise.all([
          paymentApi.getSubscriptionPlans(), // Fetch anyway to check connectivity
          paymentApi.getPackages()
        ]);
        // Overwrite fetched plans with MOCK data for absolute consistency
        setPlans(MOCK_PLANS);
        setPackages(packagesData);
      } catch (error) {
        console.error('Failed to load pricing data:', error);
        setPlans(MOCK_PLANS);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (plan.price === 0) return; // Free plan logic if needed

    setProcessingId(plan.id);
    try {
      await paymentApi.subscribe(plan.id);
      await refreshUser();
      alert(`Вы успешно подписались на план ${plan.name}`);
    } catch (error: any) {
      alert(error.message || 'Ошибка при оформлении подписки');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBuyTokens = async (pkg: TokenPackage) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    setProcessingId(pkg.id);
    try {
      // MOCK Purchase
      const response = await paymentApi.purchasePackage(pkg.id);
      await refreshUser();
      alert(response.message);
    } catch (error: any) {
      alert(error.message || 'Ошибка при покупке токенов');
    } finally {
      setProcessingId(null);
    }
  };

  const isCurrentPlan = (planId: number) => {
    if (!user?.subscription) return planId === 1; // Assuming ID 1 is free/default
    return user.subscription.subscription_plan_id === planId && user.subscription.status === 'active';
  };

  return (
    <div className="w-full pb-12 pt-16 px-2 md:px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-6 mb-8 px-4">
        <button
          onClick={onBack}
          className="w-10 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white rounded-[30px] md:rounded-full shadow-sm border border-gray-50 hover:scale-110 active:scale-95 transition-all hover:shadow-lg"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex flex-col flex-grow text-center md:text-left">
          <h2 className="text-3xl md:text-6xl font-thin tracking-widest uppercase">Магазин</h2>
          {user && (
            <div className="text-sm text-gray-400 mt-2 font-light tracking-wider flex items-center justify-center md:justify-start gap-2">
              <span className="flex items-center gap-1">Баланс: <span className="text-black font-semibold">{user.tokens ?? 0}</span> <TokenIcon className="w-4 h-4 text-yellow-500" /></span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-12">
        <SlidingTabs
          tabs={[
            { id: 'plans', label: 'Подписка' },
            { id: 'tokens', label: 'Токены' }
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as 'plans' | 'tokens')}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : activeTab === 'plans' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.id);
            return (
              <div
                key={plan.id}
                className={`relative p-8 md:p-12 rounded-[40px] md:rounded-[60px] border transition-all duration-500 flex flex-col ${isCurrent
                  ? 'liquid-glass border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] scale-[1.03]'
                  : 'bg-white/30 border-gray-100 hover:border-gray-200 hover:scale-[1.02]'
                  }`}
              >
                <div className="mb-10 md:mb-12 text-center">
                  <h3 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-4 md:mb-6">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl md:text-5xl font-light tracking-tight text-black">
                      {plan.price > 0 ? `${plan.price} ₽` : 'Бесплатно'}
                    </span>
                    <span className="text-sm md:text-base text-gray-400 font-light">/ {plan.period === 'month' ? 'мес' : plan.period}</span>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-6 mb-12 md:mb-16 flex-grow">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full bg-black/5 shrink-0">
                      <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-[12px] md:text-[13px] font-light text-gray-600 leading-tight">
                      {plan.photos_per_day} токенов / месяц
                    </span>
                  </div>
                  {Array.isArray(plan.features) && plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="mt-1 w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full bg-black/5 shrink-0">
                        <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-[12px] md:text-[13px] font-light text-gray-600 leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrent || (processingId === plan.id)}
                  className={`w-full py-5 md:py-6 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-300 ${isCurrent
                    ? 'bg-gray-50 text-gray-300 cursor-default'
                    : 'bg-black text-white hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50'
                    }`}
                >
                  {processingId === plan.id ? 'Обработка...' : isCurrent ? 'Ваш план' : 'Выбрать'}
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="relative p-8 md:p-12 rounded-[40px] md:rounded-[60px] border border-gray-100 bg-white/30 hover:border-gray-200 hover:scale-[1.02] transition-all duration-500 flex flex-col"
            >
              <div className="mb-10 md:mb-12 text-center">
                <h3 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-4 md:mb-6">{pkg.name}</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl md:text-5xl font-light tracking-tight text-black flex items-center gap-2">
                    {pkg.tokens} <TokenIcon className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" />
                  </span>
                </div>
              </div>

              <div className="mb-12 md:mb-16 flex-grow text-center">
                <p className="text-sm text-gray-500 font-light">
                  Пакет генераций без срока действия. <br />
                  Пополняет ваш общий баланс токенов.
                </p>
              </div>

              <button
                onClick={() => handleBuyTokens(pkg)}
                disabled={processingId === pkg.id}
                className="w-full py-5 md:py-6 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-300 bg-black text-white hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50"
              >
                {processingId === pkg.id ? 'Обработка...' : `Купить за ${pkg.price} ₽`}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Payment Methods Footer */}
      <div className="mt-20 md:mt-32 px-4">
        <div className="liquid-glass rounded-[40px] md:rounded-[60px] p-10 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16 border-white/60">
          <div className="text-center md:text-left">
            <h4 className="text-2xl md:text-3xl font-light mb-4">Безопасная оплата</h4>
            <p className="text-sm md:text-base text-gray-400 font-light max-w-md">Мы поддерживаем все популярные платежные системы РФ для мгновенного доступа к AI-функциям</p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20">
            {/* Payment Logos */}
            {['МИР', 'СберПэй', 'Т-Банк', 'QR-код'].map((name, i) => (
              <div key={i} className="flex flex-col items-center gap-4 md:gap-5 grayscale hover:grayscale-0 opacity-40 hover:opacity-100 transition-all cursor-pointer hover:scale-110">
                <span className="text-2xl">💳</span>
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionView;
