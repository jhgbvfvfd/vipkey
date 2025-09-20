import React, { useEffect, useMemo, useState } from 'react';
import { useMaintenance, useSettings } from '../App';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';

const parseIps = (input: string): string[] =>
  input
    .split(/\r?\n|,|;/)
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0);

const MaintenancePage: React.FC = () => {
  const { config, loading, update } = useMaintenance();
  const { notify, t } = useSettings();
  const [enabled, setEnabled] = useState<boolean>(config.enabled);
  const [message, setMessage] = useState<string>(config.message ?? '');
  const [allowedIpsInput, setAllowedIpsInput] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(config.enabled);
    setMessage(config.message ?? '');
    setAllowedIpsInput((config.allowedAdminIps ?? []).join('\n'));
  }, [config.enabled, config.message, config.allowedAdminIps]);

  const parsedIps = useMemo(() => parseIps(allowedIpsInput), [allowedIpsInput]);

  const persistConfig = async (nextEnabled: boolean, nextMessage: string, ips: string[]) => {
    setSaving(true);
    try {
      await update({
        ...config,
        enabled: nextEnabled,
        message: nextMessage,
        allowedAdminIps: ips,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin',
      });
      setEnabled(nextEnabled);
      notify(
        nextEnabled ? t('maintenanceEnabledToast') : t('maintenanceDisabledToast')
      );
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
      notify(t('maintenanceUpdateError'), 'error');
      setEnabled(config.enabled);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    await persistConfig(!enabled, message, parsedIps);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await update({
        ...config,
        enabled,
        message,
        allowedAdminIps: parsedIps,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin',
      });
      notify(t('maintenanceUpdateSuccess'));
    } catch (error) {
      console.error('Failed to save maintenance config:', error);
      notify(t('maintenanceUpdateError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const lastUpdated = config.updatedAt ? new Date(config.updatedAt).toLocaleString('th-TH') : null;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{t('maintenancePageTitle')}</CardTitle>
          <p className="text-sm text-slate-500">{t('maintenancePageDescription')}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-12 text-slate-500">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
              <p className="text-sm">{t('maintenanceChecking')}</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
                      {t('maintenanceStatusLabel')}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {enabled ? t('maintenanceStatusOn') : t('maintenanceStatusOff')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {lastUpdated ? `${t('maintenanceLastUpdated')} ${lastUpdated}` : t('maintenanceNoUpdateInfo')}
                    </p>
                  </div>
                  <div className={`inline-flex h-9 items-center rounded-full px-4 text-xs font-semibold ${
                    enabled
                      ? 'border border-amber-400/50 bg-amber-400/10 text-amber-500'
                      : 'border border-emerald-400/50 bg-emerald-400/10 text-emerald-500'
                  }`}>
                    {enabled ? t('maintenanceStatusOn') : t('maintenanceStatusOff')}
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                  {t('maintenanceAdminOnly')}
                </p>
                <Button
                  onClick={handleToggle}
                  disabled={saving || loading}
                  className="mt-6 w-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white shadow-[0_18px_35px_-15px_rgba(56,189,248,0.6)] hover:from-sky-400 hover:via-blue-500 hover:to-indigo-600"
                >
                  {enabled ? t('maintenanceToggleOff') : t('maintenanceToggleOn')}
                </Button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {t('maintenanceMessageLabel')}
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-sky-500/40"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('maintenanceMessagePlaceholder')}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {t('maintenanceAllowedIpsLabel')}
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:ring-sky-500/40"
                    value={allowedIpsInput}
                    onChange={(e) => setAllowedIpsInput(e.target.value)}
                    placeholder="123.123.123.123"
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {t('maintenanceAllowedIpsHint')}
                  </p>
                  {parsedIps.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {parsedIps.map((ip) => (
                        <span
                          key={ip}
                          className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
                        >
                          {ip}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">{t('maintenanceNoAllowedIps')}</p>
                  )}
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="w-full sm:w-auto"
                >
                  {saving ? t('maintenanceSaving') : t('maintenanceSaveChanges')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenancePage;
