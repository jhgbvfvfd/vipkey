import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import { UserIcon } from '@heroicons/react/24/outline';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useAuth } from '../App';
import { Agent } from '../types';

const AgentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const agent = user?.data as Agent;
  return (
    <div className="space-y-6">
      <PageHeader icon={<UserIcon className="w-5 h-5" />} title="โปรไฟล์" description="ข้อมูลบัญชีของคุณ" />
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{agent.username}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 text-sm">เครดิตคงเหลือ: <span className="font-medium text-blue-600">{agent.credits.toLocaleString()}</span></p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentProfilePage;
