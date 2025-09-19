import React from 'react';
import { Platform } from '../../types';

interface PlatformTabsProps {
  platforms: Platform[];
  selected: string;
  onSelect: (id: string) => void;
}

const PlatformTabs: React.FC<PlatformTabsProps> = ({ platforms, selected, onSelect }) => {
  if (platforms.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {platforms.map(p => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap border backdrop-blur
            ${selected === p.id
              ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-500 text-white border-transparent shadow-lg shadow-blue-500/30 scale-[1.02]'
              : 'bg-white/80 text-slate-700 border-slate-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200'
            }`}
        >
          <span className="relative z-10 flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-blue-400/80 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
            {p.title}
          </span>
          {selected === p.id && (
            <span className="absolute inset-0 rounded-xl border border-white/30 opacity-60"></span>
          )}
        </button>
      ))}
    </div>
  );
};

export default PlatformTabs;
