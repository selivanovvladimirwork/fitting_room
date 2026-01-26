import React, { useState, useRef, useEffect } from 'react';

interface SlidingTabsProps {
    tabs: { id: string; label: string }[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export const SlidingTabs: React.FC<SlidingTabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
    const [tabStyle, setTabStyle] = useState({ left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        const activeIndex = tabs.findIndex((t) => t.id === activeTab);
        const activeEl = tabRefs.current[activeIndex];

        if (activeEl && containerRef.current) {
            // Calculate relative position within the container
            const containerRect = containerRef.current.getBoundingClientRect();
            const tabRect = activeEl.getBoundingClientRect();

            setTabStyle({
                left: tabRect.left - containerRect.left,
                width: tabRect.width
            });
        }
    }, [activeTab, tabs]);

    return (
        <div className={`relative flex bg-white border border-gray-100 rounded-full p-1 shadow-sm w-fit mx-auto ${className}`} ref={containerRef}>
            {/* Sliding Pill */}
            <div
                className="absolute top-1 bottom-1 bg-black rounded-full transition-all duration-300 ease-out shadow-md"
                style={{
                    left: tabStyle.left,
                    width: tabStyle.width,
                }}
            />

            {/* Tab Buttons */}
            {tabs.map((tab, index) => (
                <button
                    key={tab.id}
                    ref={(el) => (tabRefs.current[index] = el)}
                    onClick={() => onChange(tab.id)}
                    className={`relative z-10 px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-black'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};
