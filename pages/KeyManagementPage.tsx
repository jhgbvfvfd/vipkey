import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useSettings } from '../App';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { KeyIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const KeyManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useSettings();
  const isAgent = user.role === 'agent';

  const options = [
    {
      title: t('generateKey'),
      desc: t('generateKeyDesc'),
      icon: <KeyIcon className="w-8 h-8 text-blue-600" />,
      onClick: () => navigate('/generate-key'),
    },
    {
      title: t('manageKeys'),
      desc: t('manageKeysDesc'),
      icon: <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600" />,
      onClick: () => navigate(isAgent ? '/my-keys' : '/keys'),
    },
  ];

  return (
    <div className="max-w-screen-md mx-auto grid gap-6 sm:grid-cols-2">
      {options.map(opt => (
        <Card key={opt.title} onClick={opt.onClick} className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="flex items-center gap-3">
            {opt.icon}
            <CardTitle className="text-lg">{opt.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-600">{opt.desc}</CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KeyManagementPage;
