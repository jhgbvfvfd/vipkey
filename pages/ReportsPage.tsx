import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const ReportsPage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader icon={<ChartBarIcon className="w-5 h-5" />} title="รายงาน" description="สรุปรายงานการใช้งานระบบ" />
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>ยังไม่มีข้อมูลรายงาน</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-500 text-sm">ฟีเจอร์รายงานกำลังอยู่ในระหว่างการพัฒนา</p>
      </CardContent>
    </Card>
  </div>
);

export default ReportsPage;
