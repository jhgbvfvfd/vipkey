import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import { useData, useAuth, useSettings } from '../App';
import { Agent } from '../types';

const KeyLogsPage: React.FC = () => {
  const { keyLogs, agents } = useData();
  const { user } = useAuth();
  const { t } = useSettings();

  const filteredLogs = user?.role === 'agent'
    ? keyLogs.filter((log) => log.agentId === (user.data as Agent).id)
    : keyLogs;

  return (
    <div className="p-4">
      <PageHeader title={t('logsTitle')} desc={t('logsDesc')} />
      {filteredLogs.length === 0 ? (
        <p className="text-center text-slate-500 mt-8">{t('noLogs')}</p>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full bg-white border border-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-2 border-b border-slate-200 text-left">{t('key')}</th>
                {user?.role === 'admin' && (
                  <th className="p-2 border-b border-slate-200 text-left">{t('agents')}</th>
                )}
                <th className="p-2 border-b border-slate-200 text-left">{t('ipAddress')}</th>
                <th className="p-2 border-b border-slate-200 text-left">{t('usedAt')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="odd:bg-white even:bg-slate-50">
                  <td className="p-2 border-b border-slate-200 font-mono">{log.key}</td>
                  {user?.role === 'admin' && (
                    <td className="p-2 border-b border-slate-200">
                      {agents.find((a) => a.id === log.agentId)?.username || '-'}
                    </td>
                  )}
                  <td className="p-2 border-b border-slate-200 font-mono">{log.ip}</td>
                  <td className="p-2 border-b border-slate-200">
                    {new Date(log.usedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default KeyLogsPage;
