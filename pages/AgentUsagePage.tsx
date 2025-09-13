import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const AgentUsagePage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader icon={<ChartPieIcon className="w-5 h-5" />} title="การใช้งาน" description="สรุปการใช้งานของคุณ" />
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>ยังไม่มีข้อมูลการใช้งาน</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-500 text-sm">ฟีเจอร์สรุปการใช้งานกำลังอยู่ในระหว่างการพัฒนา</p>
      </CardContent>
    </Card>
  </div>
);

export default AgentUsagePage;
