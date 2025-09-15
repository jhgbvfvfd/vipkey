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
          className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors duration-150 whitespace-nowrap ${
            selected === p.id
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          {p.title}
        </button>
      ))}
    </div>
  );
};

export default PlatformTabs;
