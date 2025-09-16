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
    <div className="flex gap-3 overflow-x-auto pb-2">
      {platforms.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-150 whitespace-nowrap shadow-sm ${
            selected === p.id
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:shadow'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              selected === p.id ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
            }`}
          >
            {p.title.charAt(0).toUpperCase()}
          </span>
          <span>{p.title}</span>
        </button>
      ))}
    </div>
  );
};

export default PlatformTabs;
