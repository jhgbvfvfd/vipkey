import React, { useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useAuth, useSettings } from '../App';
import { Agent } from '../types';
import { useExpirationCountdown } from '../hooks/useExpirationCountdown';

const AgentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useSettings();
  const agent = user?.data as Agent;
  const { expirationDate, isExpired, formattedTimeLeft } = useExpirationCountdown(agent.expirationAt);
  const expirationText = useMemo(() => {
    if (!expirationDate) {
      return 'บัญชีนี้ไม่มีวันหมดอายุ';
    }
    const formattedDate = expirationDate.toLocaleString('th-TH');
    if (isExpired) {
      return `บัญชีหมดอายุ: ${formattedDate} (บัญชีหมดอายุแล้ว)`;
    }
    return `บัญชีหมดอายุ: ${formattedDate} (เหลือเวลา ${formattedTimeLeft})`;
  }, [expirationDate, formattedTimeLeft, isExpired]);
  return (
    <div className="space-y-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{agent.username}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 text-sm">เครดิตคงเหลือ: <span className="font-medium text-blue-600">{agent.credits.toLocaleString()}</span></p>
          <p className={`text-sm mt-2 ${isExpired ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
            {expirationText}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentProfilePage;
