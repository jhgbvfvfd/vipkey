import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const SettingsPage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader icon={<Cog6ToothIcon className="w-5 h-5" />} title="การตั้งค่า" description="ปรับแต่งค่าระบบ" />
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>ตั้งค่าทั่วไป</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-500 text-sm">ยังไม่มีตัวเลือกการตั้งค่า</p>
      </CardContent>
    </Card>
  </div>
);

export default SettingsPage;
