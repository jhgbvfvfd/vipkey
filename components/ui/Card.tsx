import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const baseClasses = `
    bg-white border border-slate-200 rounded-lg shadow-sm
  `;
  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-300' : '';
  
  return (
    <div className={`${baseClasses} ${interactiveClasses} ${className}`}>
        {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`border-b border-slate-200 p-3 ${className}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <h3 className={`text-md font-semibold text-slate-800 ${className}`}>{children}</h3>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-3 text-slate-600 ${className}`}>
    {children}
  </div>
);


export default Card;