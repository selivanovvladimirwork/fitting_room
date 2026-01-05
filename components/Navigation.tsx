
import React, { useState, useEffect, useRef } from 'react';
import { View } from '../types';

interface NavigationProps {
  currentView: View;
  setView: (view: View) => void;
}

import { useAuth } from '../context/AuthContext';

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const { requireAuth } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [pillStyle, setPillStyle] = useState({ width: 0, left: 0 });
  const navRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const navItems = [
    { id: View.FEED, label: 'Поиск', protected: false },
    { id: View.HOME, label: 'Примерочная', protected: false }, // Renamed from Recommendations
    { id: View.AVATAR, label: 'Мой профиль', protected: true },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY || currentScrollY <= 0) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const activeIndex = navItems.findIndex(item => item.id === currentView);
    const effectiveIndex = activeIndex === -1 ? navItems.findIndex(item => item.id === View.AVATAR) : activeIndex;

    const updatePill = () => {
      const activeElement = navRefs.current[effectiveIndex];
      // Parent padding is 4px (p-1). So offsetLeft should be 4 for the first item.
      if (activeElement) {
        const { offsetLeft, offsetWidth } = activeElement;
        setPillStyle({
          width: offsetWidth, // Remove manual adjustment
          left: offsetLeft    // Remove manual adjustment
        });
      }
    };

    // Initial calculation
    updatePill();

    // ResizeObserver for robust layout handling (fonts, resizing)
    const observer = new ResizeObserver(updatePill);
    if (navRefs.current[effectiveIndex]) {
      observer.observe(navRefs.current[effectiveIndex]!);
    }
    // Also observe container to be safe? Or just rely on element resize.
    // Let's observe the parent container to catch font loading layout shifts better.
    const container = navRefs.current[effectiveIndex]?.parentElement;
    if (container) observer.observe(container);

    // Fallback timer just in case
    const timer = setTimeout(updatePill, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [currentView]);

  const handleLogoClick = () => {
    if (currentView === View.FEED) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setView(View.FEED);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavClick = (item: { id: View, protected: boolean }) => {
    if (item.protected) {
      requireAuth(() => setView(item.id));
    } else {
      setView(item.id);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 py-6 md:py-8 flex justify-center pointer-events-none transition-all duration-700 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
      <style>{`
        @keyframes shine {
          from { left: -100%; }
          to { left: 100%; }
        }
        .logo-container:hover .shine-effect {
          animation: shine 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ai-node {
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
      `}</style>

      <div className="w-full max-w-7xl mx-auto px-2 md:px-6 flex items-center justify-center md:justify-between pointer-events-auto">

        {/* Логотип - центрирован на мобилках */}
        <div className="flex items-center justify-center">
          <div
            className="logo-container group relative px-6 md:px-8 py-3 md:py-3.5 cursor-pointer liquid-glass rounded-full transition-all duration-500 hover:scale-105 active:scale-95 flex items-center justify-center border-white/60 overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)]"
            onClick={handleLogoClick}
          >
            <div className="shine-effect absolute top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 -left-full transition-none pointer-events-none"></div>

            <div className="flex items-center gap-2 md:gap-3 relative z-10">
              <span className="text-black text-[11px] md:text-[13px] font-thin uppercase tracking-[0.3em] md:tracking-[0.35em] transition-all duration-500 group-hover:tracking-[0.45em]">
                Примерочная
              </span>

              <div className="h-3 md:h-4 w-[1px] bg-black/10 mx-1"></div>

              <div className="flex flex-col items-start leading-none">
                <span className="font-bold text-[7px] md:text-[8px] tracking-[0.15em] text-gray-400 group-hover:text-black transition-colors uppercase">Studio</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="ai-node w-1 h-1 rounded-full bg-black/20 group-hover:bg-black transition-colors"></div>
                  <span className="text-[5px] md:text-[6px] font-bold text-gray-300 uppercase tracking-tighter">AI VISION</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Меню навигации - скрыто на мобилках */}
        <div className="hidden md:flex liquid-glass-dark p-1 rounded-full shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] items-center relative transition-all">
          <div
            className="absolute top-1 bottom-1 bg-white rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.05)] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)"
            style={{
              width: `${pillStyle.width}px`,
              left: `${pillStyle.left}px`
            }}
          />

          {navItems.map((item, index) => (
            <button
              key={item.id}
              ref={el => navRefs.current[index] = el}
              onClick={() => handleNavClick(item)}
              className={`px-6 py-3.5 text-[13px] tracking-wide transition-all duration-300 rounded-full relative z-10 group flex items-center justify-center whitespace-nowrap ${currentView === item.id ? 'scale-[1.05]' : 'hover:scale-105'
                }`}
            >
              <div className="grid-stack leading-none">
                <span className="font-semibold invisible pointer-events-none select-none h-0 opacity-0" aria-hidden="true">
                  {item.label}
                </span>
                <span className={`flex items-center transition-all duration-300 ${currentView === item.id || (item.id === View.AVATAR && currentView === View.SETTINGS) || (item.id === View.AVATAR && currentView === View.SUBSCRIPTION) || (item.id === View.AVATAR && currentView === View.POST_DETAIL) ? 'text-black font-semibold' : 'text-gray-500 group-hover:text-black font-normal'
                  }`}>
                  {item.label}
                </span>
              </div>
            </button>
          ))}
        </div>

      </div>
    </nav>
  );
};

export default Navigation;
