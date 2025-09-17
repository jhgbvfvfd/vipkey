import React from 'react';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { Platform } from '../../types';

interface PlatformTabsProps {
  platforms: Platform[];
  selected: string;
  onSelect: (id: string) => void;
}

const PlatformTabs: React.FC<PlatformTabsProps> = ({ platforms, selected, onSelect }) => {
  if (platforms.length === 0) return null;

  const describePattern = (pattern?: number[]) => {
    if (!pattern || pattern.length === 0) return null;

    return pattern.map(length => `${length} char${length > 1 ? 's' : ''}`).join(' • ');
  };

  const createExampleKey = (prefix?: string, pattern?: number[]) => {
    const bulletGroup = (length: number) => '●'.repeat(Math.min(length, 4));
    const sanitizedPrefix = prefix ? prefix.replace(/-+$/u, '') : '';

    if (!pattern || pattern.length === 0) {
      return `${sanitizedPrefix ? `${sanitizedPrefix}-` : ''}●●●●-●●●●`;
    }

    return `${sanitizedPrefix ? `${sanitizedPrefix}-` : ''}${pattern
      .map(length => bulletGroup(length))
      .join('-')}`;
  };

  const colorVariants = [
    {
      gradient: 'from-sky-400/30 via-white/30 to-transparent',
      ring: 'ring-sky-400/60',
      border: 'border-sky-400/30',
      badge: 'bg-sky-500/15 text-sky-700',
      dot: 'bg-sky-500',
    },
    {
      gradient: 'from-violet-400/30 via-white/30 to-transparent',
      ring: 'ring-violet-400/60',
      border: 'border-violet-400/30',
      badge: 'bg-violet-500/15 text-violet-700',
      dot: 'bg-violet-500',
    },
    {
      gradient: 'from-emerald-400/30 via-white/30 to-transparent',
      ring: 'ring-emerald-400/60',
      border: 'border-emerald-400/30',
      badge: 'bg-emerald-500/15 text-emerald-700',
      dot: 'bg-emerald-500',
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {platforms.map((platform, index) => {
        const isSelected = selected === platform.id;
        const initial = platform.title?.charAt(0)?.toUpperCase() || '?';
        const variant = colorVariants[index % colorVariants.length];
        const patternDescription = describePattern(platform.pattern);
        const exampleKey = createExampleKey(platform.prefix, platform.pattern);

        return (
          <button
            key={platform.id}
            type="button"
            onClick={() => onSelect(platform.id)}
            aria-pressed={isSelected}
            className={`group relative overflow-hidden rounded-3xl border bg-white/70 p-6 text-left shadow-[0_18px_45px_-25px_rgba(15,23,42,0.45)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
              isSelected
                ? `scale-[1.01] border-transparent ring-2 ${variant.ring} ring-offset-2 ring-offset-white`
                : 'border-slate-200/70 hover:-translate-y-1 hover:border-slate-300/70 hover:shadow-[0_30px_70px_-35px_rgba(15,23,42,0.55)]'
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
              className={`pointer-events-none absolute -inset-12 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.55),transparent_55%)] transition-opacity duration-500 ${
                isSelected ? 'opacity-60' : 'opacity-0 group-hover:opacity-40'
              }`}
            />
            <span
              aria-hidden
              className={`pointer-events-none absolute -inset-16 bg-[conic-gradient(from_120deg_at_50%_-20%,rgba(255,255,255,0.4),transparent,rgba(255,255,255,0.4))] transition-opacity duration-500 ${
                isSelected ? 'opacity-80' : 'opacity-0 group-hover:opacity-50'
              }`}
            />
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-[1px] rounded-[calc(1.5rem-1px)] border border-white/50 bg-white/20 backdrop-blur-xl transition-colors ${
                isSelected ? variant.border : 'border-white/40'
              }`}
            />

            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-xl font-semibold uppercase tracking-[0.35em] text-slate-700 transition-all ${
                  isSelected
                    ? 'border-transparent bg-white text-slate-900 shadow-lg shadow-slate-900/10'
                    : 'border-white/70 bg-white/70 group-hover:border-white/90 group-hover:text-slate-900'
                }`}
              >
                {initial}
              </div>

              <div className="relative flex-1 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-lg font-semibold tracking-tight transition-colors ${
                          isSelected ? 'text-slate-900' : 'text-slate-800 group-hover:text-slate-900'
                        }`}
                      >
                        {platform.title}
                      </p>
                      <span className="rounded-full border border-white/60 bg-white/70 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400">
                        Platform
                      </span>
                    </div>

                    {patternDescription && (
                      <p className="mt-1 text-sm text-slate-500">
                        Structure
                        <span className="mx-2 inline-flex items-center rounded-full border border-white/70 bg-white/70 px-2 py-0.5 font-medium text-slate-600">
                          {patternDescription}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 text-xs font-semibold">
                    {isSelected && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 shadow-sm shadow-slate-900/10 ${variant.badge}`}>
                        <CheckCircleIcon className="h-4 w-4" />
                        Selected
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

                <div className="flex flex-wrap items-center gap-3 text-[0.75rem] text-slate-500">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 transition-colors ${
                      isSelected
                        ? `border-transparent ${variant.badge}`
                        : 'border-slate-200/70 bg-white/80 text-slate-600 group-hover:border-slate-300'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${variant.dot}`} />
                    Prefix
                    <span className="font-semibold text-slate-700">{platform.prefix || '—'}</span>
                  </span>

                  <span className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.3em] text-slate-400">
                    Example key
                    <span className="rounded-lg bg-slate-900/90 px-2 py-1 text-[0.7rem] text-white shadow-[0_4px_20px_rgba(15,23,42,0.35)]">
                      {exampleKey}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default PlatformTabs;
