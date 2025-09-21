import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from '../../types';

interface PlatformTabsProps {
  platforms: Platform[];
  selected: string;
  onSelect: (id: string) => void;
}

const getInitial = (value: string): string => {
  const trimmed = value?.trim();
  if (!trimmed) return '?';
  return trimmed[0]?.toUpperCase() ?? '?';
};

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
        className="group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl border border-white/60 bg-white/95 px-5 py-4 text-left text-sm font-semibold text-slate-800 shadow-[0_24px_55px_-32px_rgba(59,130,246,0.65)] backdrop-blur transition hover:-translate-y-0.5 hover:border-sky-200/80 hover:shadow-[0_32px_70px_-36px_rgba(56,189,248,0.75)]"
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(120deg,rgba(125,211,252,0),rgba(125,211,252,0.4),rgba(125,211,252,0))]" />
        </span>
        <span className="relative flex flex-1 items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 text-lg font-bold text-white shadow-[0_18px_35px_-20px_rgba(59,130,246,0.8)]">
            {getInitial(selectedPlatform.title)}
          </span>
          <span className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-[0.28em] text-blue-500/80">แพลตฟอร์มที่เลือก</span>
            <span className="mt-1 flex items-center gap-2 text-base text-slate-900">
              <span className="inline-flex h-1.5 w-6 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500" />
              {selectedPlatform.title}
            </span>
          </span>
        </span>
        <span className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-20 mt-3 overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_28px_70px_-36px_rgba(59,130,246,0.65)] backdrop-blur">
          <div className="relative max-h-60 overflow-y-auto py-2">
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/70 to-transparent" />
            {platforms.map((platform) => {
              const isSelected = platform.id === selectedPlatform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => handleSelect(platform.id)}
                  className={`relative flex w-full items-center gap-3 px-5 py-3 text-left text-sm transition-all duration-300 ${
                    isSelected
                      ? 'bg-sky-50/70 text-slate-900'
                      : 'text-slate-600 hover:bg-sky-50/80 hover:text-slate-900'
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100 text-base font-semibold text-blue-600">
                    {getInitial(platform.title)}
                  </span>
                  <span className="flex flex-col">
                    <span className="font-semibold text-slate-800">{platform.title}</span>
                    {platform.description && (
                      <span className="text-xs text-slate-500">{platform.description}</span>
                    )}
                  </span>
                  {isSelected && (
                    <span className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_12px_25px_-18px_rgba(56,189,248,0.75)]">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
