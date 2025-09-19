import React, { useCallback, useEffect } from 'react';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { Platform } from '../../types';
import { normalizePattern } from '../../utils/keyGenerator';

interface PlatformTabsProps {
  platforms: Platform[];
  selected: string;
  onSelect: (id: string) => void;
}

const accentPalette = [
  {
    gradient: 'from-sky-400/25 via-cyan-300/10 to-transparent',
    ring: 'ring-sky-400/60 shadow-[0_25px_60px_-30px_rgba(56,189,248,0.55)]',
    badge: 'bg-sky-500/15 text-sky-700',
    prefixSelected: 'border-transparent bg-sky-500/10 text-sky-700',
    dot: 'bg-sky-500',
    initial: 'border-white/70 bg-white text-slate-500 group-hover:text-slate-700',
    initialSelected: 'bg-sky-500 text-white shadow-lg shadow-sky-500/30',
  },
  {
    gradient: 'from-violet-400/25 via-fuchsia-300/10 to-transparent',
    ring: 'ring-violet-400/60 shadow-[0_25px_60px_-30px_rgba(168,85,247,0.45)]',
    badge: 'bg-violet-500/15 text-violet-700',
    prefixSelected: 'border-transparent bg-violet-500/10 text-violet-700',
    dot: 'bg-violet-500',
    initial: 'border-white/70 bg-white text-slate-500 group-hover:text-slate-700',
    initialSelected: 'bg-violet-500 text-white shadow-lg shadow-violet-500/30',
  },
  {
    gradient: 'from-emerald-400/25 via-teal-300/10 to-transparent',
    ring: 'ring-emerald-400/60 shadow-[0_25px_60px_-30px_rgba(16,185,129,0.45)]',
    badge: 'bg-emerald-500/15 text-emerald-700',
    prefixSelected: 'border-transparent bg-emerald-500/10 text-emerald-700',
    dot: 'bg-emerald-500',
    initial: 'border-white/70 bg-white text-slate-500 group-hover:text-slate-700',
    initialSelected: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
  },
];

const DEFAULT_EXAMPLE_SEGMENTS = [4, 4, 4, 4];

const describePattern = (pattern: number[]) => {
  if (pattern.length === 0) return null;
  return pattern.map(length => `${length} หลัก`).join(' • ');
};

const createExampleKey = (prefix?: string | null, pattern?: number[]) => {
  const sanitizedPrefix = (prefix || '').trim().replace(/-+$/u, '');
  const lengths = pattern && pattern.length > 0 ? pattern : DEFAULT_EXAMPLE_SEGMENTS;
  const bulletGroup = (length: number) => '●'.repeat(Math.min(Math.max(length, 1), 4));
  const body = lengths.map(length => bulletGroup(length)).join('-');
  return sanitizedPrefix ? `${sanitizedPrefix}-${body}` : body;
};

const PlatformTabs: React.FC<PlatformTabsProps> = ({ platforms, selected, onSelect }) => {
  if (platforms.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center shadow-sm">
        <p className="font-semibold text-slate-700">ยังไม่มีแพลตฟอร์ม</p>
        <p className="mt-1 text-sm text-slate-500">เพิ่มแพลตฟอร์มก่อนสร้างคีย์ใหม่</p>
      </div>
    );
  }

  useEffect(() => {
    if (platforms.length === 0) return;

    const hasSelected = selected && platforms.some(platform => platform.id === selected);
    if (!hasSelected) {
      onSelect(platforms[0].id);
    }
  }, [platforms, selected, onSelect]);

  const handleSelect = useCallback(
    (id: string) => {
      if (id !== selected) {
        onSelect(id);
      }
    },
    [onSelect, selected]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      if (platforms.length === 0) return;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % platforms.length;
        handleSelect(platforms[nextIndex].id);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + platforms.length) % platforms.length;
        handleSelect(platforms[prevIndex].id);
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleSelect(platforms[currentIndex].id);
      }
    },
    [handleSelect, platforms]
  );

  return (
    <fieldset className="space-y-4">
      <legend className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">เลือกแพลตฟอร์ม</legend>
      <div
        role="radiogroup"
        aria-label="เลือกแพลตฟอร์ม"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {platforms.map((platform, index) => {
          const isSelected = selected === platform.id;
          const isInitialFocusable = !selected && index === 0;
          const variant = accentPalette[index % accentPalette.length];
          const initial = platform.title?.trim().charAt(0)?.toUpperCase() || '?';
          const normalizedPattern = normalizePattern(platform.pattern);
          const patternDescription = describePattern(normalizedPattern);
          const exampleKey = createExampleKey(platform.prefix, normalizedPattern);

          return (
            <button
              key={platform.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={platform.title}
              tabIndex={isSelected || isInitialFocusable ? 0 : -1}
              onClick={() => handleSelect(platform.id)}
              onKeyDown={event => handleKeyDown(event, index)}
              className={`group relative flex h-full w-full cursor-pointer overflow-hidden rounded-2xl border bg-white/80 p-5 text-left shadow-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                isSelected
                  ? `border-transparent ${variant.ring}`
                  : 'border-slate-200/70 hover:-translate-y-0.5 hover:border-slate-300/70 hover:shadow-[0_20px_45px_-25px_rgba(15,23,42,0.25)]'
              }`}
            >
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br transition-opacity duration-500 ${
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                } ${variant.gradient}`}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-[1px] rounded-[calc(1rem-1px)] border border-white/40 bg-white/30 backdrop-blur-md"
              />

              <div className="relative z-10 flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-semibold uppercase tracking-[0.3em] transition-all ${
                        isSelected ? variant.initialSelected : variant.initial
                      }`}
                    >
                      {initial}
                    </span>
                    <div>
                      <p className={`text-base font-semibold transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                        {platform.title}
                      </p>
                      {patternDescription && (
                        <p className="mt-1 text-xs text-slate-500">
                          โครงสร้าง
                          <span className="ml-2 rounded-full bg-white/70 px-2 py-0.5 font-medium text-slate-600 shadow-sm">
                            {patternDescription}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 text-xs font-semibold">
                    {isSelected && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 shadow-sm ${variant.badge}`}>
                        <CheckCircleIcon className="h-4 w-4" />
                        เลือกแล้ว
                      </span>
                    )}
                    {platform.apiEnabled && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-600">
                        <SparklesIcon className="h-4 w-4" />
                        API Ready
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 transition-colors ${
                      isSelected
                        ? variant.prefixSelected
                        : 'border-slate-200/70 bg-white/80 text-slate-600 group-hover:border-slate-300'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${variant.dot}`} />
                    Prefix
                    <span className="font-semibold text-slate-700">{platform.prefix?.trim() || '—'}</span>
                  </span>

                  <span className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.3em] text-slate-400">
                    ตัวอย่าง
                    <span className="rounded-md bg-slate-900/90 px-2 py-1 text-[0.7rem] text-white shadow-[0_4px_20px_rgba(15,23,42,0.35)]">
                      {exampleKey}
                    </span>
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
};

export default PlatformTabs;
