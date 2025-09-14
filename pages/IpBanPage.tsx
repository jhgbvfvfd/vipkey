import React, { useEffect, useState } from 'react';
import { useAuth, useSettings } from '../App';
import { Agent, IpBan } from '../types';
import { getIpBans, addIpBan, deleteIpBan } from '../services/firebaseService';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const IpBanPage: React.FC = () => {
  const { user } = useAuth();
  const { notify, t } = useSettings();
  const agent = user?.role === 'agent' ? (user.data as Agent) : null;
  const userId = user?.role === 'admin' ? 'admin' : agent?.id || '';
  const [ip, setIp] = useState('');
  const [bans, setBans] = useState<IpBan[]>([]);

  const load = async () => {
    if (!userId) return;
    const data = await getIpBans(userId);
    setBans(data);
  };

  useEffect(() => {
    if (user?.role === 'admin' || agent?.ipBanEnabled) {
      load();
    }
  }, [user, agent]);

  if (user?.role === 'agent' && !agent?.ipBanEnabled) {
    return <p className="p-4 text-center text-slate-500">{t('ipBanLocked')}</p>;
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim()) return;
    await addIpBan(userId, ip.trim());
    notify(t('ipAdded'));
    setIp('');
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteIpBan(userId, id);
    notify(t('ipRemoved'));
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('ipBanTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <Input value={ip} onChange={(e) => setIp(e.target.value)} placeholder={t('ipAddress')} className="flex-1" />
          <Button type="submit">{t('add')}</Button>
        </form>
        {bans.length > 0 ? (
          <ul className="divide-y divide-slate-200">
            {bans.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2">
                <span className="font-mono text-blue-600">{b.ip}</span>
                <Button size="sm" variant="danger" onClick={() => handleDelete(b.id)}>
                  {t('delete')}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-slate-500">{t('noBannedIps')}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default IpBanPage;
