import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useSettings, useMaintenance } from '../App';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent } from '../components/ui/Card';
import Logo from '../components/ui/Logo';
import Modal from '../components/ui/Modal';
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, LockOpenIcon } from '@heroicons/react/24/outline';

type CountdownState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const { login } = useAuth();
  const { notify, t, settings } = useSettings();
  const { config: maintenanceConfig, loading: maintenanceLoading } = useMaintenance();
  const [clientIp, setClientIp] = useState<string | null>(null);
  const [ipLoading, setIpLoading] = useState(true);
  const [blockedByMaintenance, setBlockedByMaintenance] = useState(false);
  const [countdown, setCountdown] = useState<CountdownState | null>(null);

  useEffect(() => {
    const remembered = localStorage.getItem('rememberUser');
    if (remembered) {
      setUsername(remembered);
      setRemember(true);
    }
    const introAccepted = localStorage.getItem('vipkey_intro_ack');
    if (!introAccepted) {
      setShowIntroModal(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIpLoading(false);
      return;
    }

    let active = true;
    const resolveIp = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) {
          throw new Error('Failed to fetch IP');
        }
        const data = await response.json();
        if (active) {
          setClientIp(data.ip);
        }
      } catch (error) {
        console.error('Unable to resolve client IP:', error);
        if (active) {
          setClientIp('');
        }
      } finally {
        if (active) {
          setIpLoading(false);
        }
      }
    };

    resolveIp();

    return () => {
      active = false;
    };
  }, []);

  const locale = useMemo(() => (settings.language === 'th' ? 'th-TH' : 'en-US'), [settings.language]);
  const maintenanceActive = useMemo(() => {
    if (!maintenanceConfig.enabled) {
      return false;
    }
    const now = Date.now();
    const startTime = maintenanceConfig.scheduledStart
      ? new Date(maintenanceConfig.scheduledStart).getTime()
      : undefined;
    const endTime = maintenanceConfig.scheduledEnd
      ? new Date(maintenanceConfig.scheduledEnd).getTime()
      : undefined;
    if (typeof startTime === 'number' && !Number.isNaN(startTime) && now < startTime) {
      return false;
    }
    if (typeof endTime === 'number' && !Number.isNaN(endTime) && now >= endTime) {
      return false;
    }
    return true;
  }, [maintenanceConfig.enabled, maintenanceConfig.scheduledStart, maintenanceConfig.scheduledEnd]);

  useEffect(() => {
    if (!maintenanceActive) {
      setBlockedByMaintenance(false);
    }
  }, [maintenanceActive]);

  const allowedIps = useMemo(() => maintenanceConfig.allowedAdminIps ?? [], [maintenanceConfig.allowedAdminIps]);
  const ipAllowed = useMemo(() => {
    if (!clientIp) return false;
    return allowedIps.includes(clientIp.trim());
  }, [allowedIps, clientIp]);
  const scheduledEndTimestamp = useMemo(() => {
    if (!maintenanceConfig.scheduledEnd) {
      return null;
    }
    const date = new Date(maintenanceConfig.scheduledEnd);
    const value = date.getTime();
    if (Number.isNaN(value)) {
      return null;
    }
    return value;
  }, [maintenanceConfig.scheduledEnd]);

  const maintenanceScheduleEnd = useMemo(() => {
    if (!scheduledEndTimestamp) {
      return null;
    }
    return new Date(scheduledEndTimestamp).toLocaleString(locale);
  }, [scheduledEndTimestamp, locale]);
  const waitingForAccess = maintenanceActive && !blockedByMaintenance && !ipAllowed && (maintenanceLoading || ipLoading);
  const maintenanceMessage = maintenanceConfig.message?.trim() || t('maintenanceDefaultMessage');
  const shouldShowMaintenanceView = maintenanceActive && !waitingForAccess && (!ipAllowed || blockedByMaintenance);

  useEffect(() => {
    if (!maintenanceConfig.enabled || !scheduledEndTimestamp) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const diff = scheduledEndTimestamp - now;

      if (diff <= 0) {
        setCountdown(null);
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [maintenanceConfig.enabled, scheduledEndTimestamp]);

  const handleIntroAccept = () => {
    localStorage.setItem('vipkey_intro_ack', 'true');
    setShowIntroModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(username, password, { clientIp: clientIp ?? undefined });
    if (result === 'success') {
      notify(t('loginSuccess'));
      if (remember) {
        localStorage.setItem('rememberUser', username);
      } else {
        localStorage.removeItem('rememberUser');
      }
    } else if (result === 'maintenance') {
      setBlockedByMaintenance(true);
      notify(t('maintenanceLoginBlocked'), 'error');
    } else if (result === 'banned') {
      notify(t('bannedUser'), 'error');
    } else {
      notify(t('loginFailed'), 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-4 text-center text-slate-100">
          <Logo className="h-20 w-20" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-sky-300/80">ADMIN BOT CSCODE</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{t('login')}</h1>
          </div>
          <p className="text-sm text-slate-300">
            ลงชื่อเข้าใช้งานด้วยข้อมูลที่ได้รับมอบหมายเพื่อเริ่มจัดการระบบได้ทันที
          </p>
        </div>
        <Card className="border border-white/10 bg-slate-900/80 text-slate-100">
          <CardContent className="space-y-6">
            {waitingForAccess ? (
              <div className="flex flex-col items-center gap-4 py-10">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
                <p className="text-sm text-slate-300">{t('maintenanceChecking')}</p>
              </div>
            ) : shouldShowMaintenanceView ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/20 text-sky-200">
                  <LockClosedIcon className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white">{t('maintenanceModeTitle')}</h2>
                  <p className="text-sm text-slate-300">{maintenanceMessage}</p>
                  <p className="text-xs text-slate-400">{t('maintenanceAdminOnly')}</p>
                  {maintenanceScheduleEnd && (
                    <p className="text-xs text-slate-400">
                      {t('maintenanceScheduleAutoResume')} {maintenanceScheduleEnd}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {t('maintenanceYourIp')}{' '}
                    <span className="font-mono text-slate-200">{clientIp && clientIp.length > 0 ? clientIp : '-'}</span>
                  </p>
                </div>
                {countdown && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {(countdown.days > 0
                      ? [
                          { label: t('maintenanceCountdownDays'), value: countdown.days },
                          { label: t('maintenanceCountdownHours'), value: countdown.hours },
                          { label: t('maintenanceCountdownMinutes'), value: countdown.minutes },
                          { label: t('maintenanceCountdownSeconds'), value: countdown.seconds }
                        ]
                      : [
                          { label: t('maintenanceCountdownHours'), value: countdown.hours },
                          { label: t('maintenanceCountdownMinutes'), value: countdown.minutes },
                          { label: t('maintenanceCountdownSeconds'), value: countdown.seconds }
                        ]
                    ).map(segment => (
                      <div key={segment.label} className="rounded-lg border border-slate-700 bg-slate-900/80 p-3 text-center">
                        <p className="text-2xl font-semibold text-white">
                          {segment.value.toString().padStart(2, '0')}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{segment.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Button onClick={() => window.location.reload()} className="w-full">
                  {t('maintenanceRefresh')}
                </Button>
              </div>
            ) : (
              <>
                {maintenanceActive && ipAllowed && (
                  <div className="rounded-lg border border-sky-400/30 bg-sky-500/10 p-4 text-sm text-slate-200">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
                      <LockOpenIcon className="h-4 w-4" />
                      {t('maintenanceModeTitle')}
                    </div>
                    <p className="mt-2 text-slate-100">{t('maintenanceAdminOnly')}</p>
                    {maintenanceScheduleEnd && (
                      <p className="mt-1 text-xs text-slate-300">
                        {t('maintenanceScheduleAutoResume')} {maintenanceScheduleEnd}
                      </p>
                    )}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    id="username"
                    label={t('username')}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('username')}
                    required
                    disabled={loading}
                    leftIcon={<UserIcon className="h-5 w-5" />}
                    labelClassName="!text-slate-200"
                    className="!border-slate-700 !bg-slate-900 !text-slate-100 focus:!border-sky-400 focus:!ring-sky-400"
                  />
                  <Input
                    id="password"
                    label={t('password')}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    leftIcon={<LockClosedIcon className="h-5 w-5" />}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="text-slate-400 transition-colors hover:text-slate-200"
                      >
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    }
                    labelClassName="!text-slate-200"
                    className="!border-slate-700 !bg-slate-900 !text-slate-100 focus:!border-sky-400 focus:!ring-sky-400"
                  />
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900 accent-sky-500"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      {t('rememberMe')}
                    </label>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'กำลังตรวจสอบ...' : t('login')}
                  </Button>
                </form>
                <p className="text-center text-xs text-slate-400">
                  หากต้องการเปลี่ยนรหัสผ่านของแอดมิน สามารถดำเนินการได้ที่เมนู “ตั้งรหัสผ่านใหม่” และใช้รหัสผ่านใหม่ในการเข้าสู่ระบบถัดไป
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Modal
        isOpen={showIntroModal}
        onClose={handleIntroAccept}
        title="ADMIN BOT CSCODE"
        hideClose
        disableBackdropClose
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            ยินดีต้อนรับสู่ระบบจัดการคีย์ ADMIN BOT CSCODE นี่เป็นคู่มือสั้นๆ ในการใช้งาน เพื่อความปลอดภัยโปรดเก็บรักษาข้อมูลการเข้าสู่ระบบไว้เฉพาะผู้มีสิทธิ์เท่านั้น
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>ตรวจสอบเครดิตก่อนสร้างคีย์ทุกครั้ง</li>
            <li>อย่าแชร์คีย์ให้ผู้ที่ไม่เกี่ยวข้อง</li>
            <li>บันทึกการใช้งานทุกครั้งเพื่อการติดตาม</li>
          </ul>
          <p className="text-xs text-slate-400">คุณสามารถเปิดอ่านคู่มือนี้อีกครั้งได้จากเมนูช่วยเหลือ</p>
          <div className="pt-2 text-right">
            <Button onClick={handleIntroAccept}>เข้าใจแล้ว</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;
