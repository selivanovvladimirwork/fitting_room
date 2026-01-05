import React from 'react';

// Using a simplified interface since Product is less relevant for "Stores" view now, but we can reuse types if needed.
interface Store {
  id: string;
  name: string;
  imageUrl: string;
  url: string;
}

const ShopView: React.FC = () => {
  const stores: Store[] = [
    { id: '1', name: 'Zara', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg', url: '#' },
    { id: '2', name: 'Lamoda', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Lamoda_logo_2023.svg/2560px-Lamoda_logo_2023.svg.png', url: '#' },
    { id: '3', name: 'Nike', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg', url: '#' },
    { id: '5', name: 'LIME', imageUrl: 'https://lime-shop.com/assets/logo.svg', url: '#' },
    { id: '6', name: 'TSUM', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/77/TSUM_department_store_logo.png', url: '#' },
    { id: '4', name: 'Wildberries', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Wildberries_logo_%282023%29.svg', url: '#' },
    { id: '7', name: 'Ozon', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Ozon_Logo.svg', url: '#' },
  ];

  return (
    <div className="py-8 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-12">
        <div>
          <h2 className="text-4xl md:text-5xl font-thin tracking-tight mb-6">Шоппинг</h2>
          <p className="text-gray-400 font-light max-w-lg leading-relaxed text-sm">
            Топовые маркетплейсы и шоурумы. Нажмите на карточку для перехода на страницу магазина.
            Добавляйте свои наиболее понравившиеся магазины.
          </p>
        </div>
      </div>

      {/* Stores Grid - Horizontal Scroll on Mobile, Grid on Desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {stores.map(store => (
          <div key={store.id} className="group cursor-pointer">
            <div className="aspect-[4/5] bg-gray-50 rounded-[32px] overflow-hidden relative shadow-sm group-hover:shadow-xl transition-all duration-500 border border-gray-100/50 flex items-center justify-center p-8 bg-white">
              <img
                src={store.imageUrl}
                alt={store.name}
                className="w-full h-auto object-contain max-h-[100px] opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110 grayscale group-hover:grayscale-0"
              />

              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

              <div className="absolute top-4 right-4 text-gray-300 group-hover:text-black transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </div>
            </div>
            <div className="mt-3 text-center">
              <h3 className="font-bold text-lg text-gray-800 tracking-tight">{store.name}</h3>
            </div>
          </div>
        ))}

        {/* "Add Store" Placeholder */}
        <div className="group cursor-pointer border-2 border-dashed border-gray-200 rounded-[32px] aspect-[4/5] flex flex-col items-center justify-center hover:border-black/20 hover:bg-gray-50 transition-all">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-md transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </div>
          <span className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors">Добавить</span>
        </div>
      </div>

      {/* Ads Placeholder */}
      <div className="mt-20 border-t border-gray-100 pt-12 text-center">
        <div className="max-w-2xl mx-auto p-12 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm">
            Впоследствии здесь могут быть интегрированы рекламные предложения
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShopView;
