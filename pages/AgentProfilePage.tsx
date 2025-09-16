import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useAuth, useSettings } from '../App';
import { Agent } from '../types';

const AgentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useSettings();
  const agent = user?.data as Agent;
  return (
    <div className="space-y-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{agent.username}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 text-sm">เครดิตคงเหลือ: <span className="font-medium text-blue-600">{agent.credits.toLocaleString()}</span></p>
          <p className="text-slate-500 text-sm mt-2">
            {agent.expirationAt
              ? `บัญชีหมดอายุ: ${new Date(agent.expirationAt).toLocaleString('th-TH')}`
              : 'บัญชีนี้ไม่มีวันหมดอายุ'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentProfilePage;
