import React from 'react';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ icon, title, description }) => (
  <div className="flex items-center mb-6">
    <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-md bg-blue-600 text-white">
      {icon}
    </div>
    <div>
      <h1 className="text-lg font-bold text-slate-800">{title}</h1>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
  </div>
);

export default PageHeader;
