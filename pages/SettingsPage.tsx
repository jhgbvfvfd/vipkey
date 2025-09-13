import React, { useState, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';

interface Settings {
  notifications: boolean;
  darkMode: boolean;
  language: string;
}

const defaultSettings: Settings = {
  notifications: true,
  darkMode: false,
  language: 'th',
};

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem('settings');
    if (saved) {
      const parsed: Settings = JSON.parse(saved);
      setSettings(parsed);
      document.documentElement.classList.toggle('dark', parsed.darkMode);
      document.documentElement.setAttribute('lang', parsed.language);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('settings', JSON.stringify(settings));
    document.documentElement.classList.toggle('dark', settings.darkMode);
    document.documentElement.setAttribute('lang', settings.language);
    toast.success('บันทึกการตั้งค่าแล้ว');
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={<Cog6ToothIcon className="w-5 h-5" />} title="การตั้งค่า" description="ปรับแต่งค่าระบบ" />
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>ตั้งค่าทั่วไป</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-slate-700 mb-1">
                ภาษา
              </label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="th">ไทย</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">เปิดการแจ้งเตือน</span>
              <ToggleSwitch
                checked={settings.notifications}
                onChange={(checked) => setSettings({ ...settings, notifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">โหมดมืด</span>
              <ToggleSwitch
                checked={settings.darkMode}
                onChange={(checked) => setSettings({ ...settings, darkMode: checked })}
              />
            </div>
            <Button type="submit" className="w-full">
              บันทึก
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
