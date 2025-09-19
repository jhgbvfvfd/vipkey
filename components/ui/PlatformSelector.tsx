import React from 'react';
import { Platform } from '../../types';
import { motion } from 'framer-motion';

interface PlatformSelectorProps {
  platforms: Platform[];
  selected: string;
  onSelect: (id: string) => void;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({ platforms, selected, onSelect }) => {
  if (platforms.length === 0) {
    return <p className="text-center text-slate-500">ไม่มีแพลตฟอร์ม</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {platforms.map(p => (
        <motion.div
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
            selected === p.id
              ? 'bg-blue-600 border-blue-700 text-white shadow-lg'
              : 'bg-white border-slate-300 hover:border-blue-500 hover:shadow-md'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <h3 className="font-bold text-lg">{p.title}</h3>
          <p className="text-sm opacity-80">{p.description}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default PlatformSelector;
