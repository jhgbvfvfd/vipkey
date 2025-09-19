import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from '../../types';

interface PlatformTabsProps {
  platforms: Platform[];
  selected: string;
  onSelect: (id: string) => void;
}

const PlatformTabs: React.FC<PlatformTabsProps> = ({ platforms, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedPlatform = useMemo(() => {
    if (platforms.length === 0) return undefined;
    return platforms.find(p => p.id === selected) ?? platforms[0];
  }, [platforms, selected]);

  if (!selectedPlatform) return null;

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 text-left text-sm font-semibold text-slate-800 shadow-lg shadow-blue-100/30 transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none"
      >
        <span className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-blue-500/80">แพลตฟอร์มที่เลือก</span>
          <span className="mt-0.5 flex items-center gap-2 text-base text-slate-900">
            <span className="inline-flex h-2 w-2 rounded-full bg-blue-400/80 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
            {selectedPlatform.title}
          </span>
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/40 transition-transform group-hover:scale-105">
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full min-w-[220px] overflow-hidden rounded-2xl border border-blue-100 bg-white/95 shadow-2xl shadow-blue-200/40 backdrop-blur">
          <div className="max-h-60 overflow-y-auto py-2">
            {platforms.map(platform => {
              const isSelected = platform.id === selectedPlatform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => handleSelect(platform.id)}
                  className={`relative flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-all duration-150 ${
                    isSelected
                      ? 'bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <span className="inline-flex h-2 w-2 rounded-full bg-blue-400/80 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                  <span className="flex flex-col">
                    <span className="font-semibold">{platform.title}</span>
                    {platform.description && (
                      <span className="text-xs text-slate-500">{platform.description}</span>
                    )}
                  </span>
                  {isSelected && (
                    <span className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-inner">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformTabs;
