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
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 shadow-sm hover:border-sky-300 hover:text-slate-900"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-base font-semibold text-sky-600">
            {getInitial(selectedPlatform.title)}
          </span>
          <span className="flex flex-col">
            <span className="text-xs text-slate-500">แพลตฟอร์มที่เลือก</span>
            <span className="text-sm text-slate-800">{selectedPlatform.title}</span>
          </span>
        </span>
        <svg
          className={`h-5 w-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {platforms.map(platform => {
            const isSelected = platform.id === selectedPlatform.id;
            return (
              <button
                key={platform.id}
                onClick={() => handleSelect(platform.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm ${
                  isSelected ? 'bg-sky-50 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-sky-600">
                  {getInitial(platform.title)}
                </span>
                <span className="flex flex-col">
                  <span className="font-medium">{platform.title}</span>
                  {platform.description && <span className="text-xs text-slate-500">{platform.description}</span>}
                </span>
                {isSelected && (
                  <svg className="ml-auto h-4 w-4 text-sky-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlatformTabs;
