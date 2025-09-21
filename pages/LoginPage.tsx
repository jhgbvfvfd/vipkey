import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useSettings, useMaintenance } from '../App';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Logo from '../components/ui/Logo';
import Modal from '../components/ui/Modal';
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

type CountdownState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const accentMatrix = [
  'ADMIN • BOT • CSCODE',
  'SECURE • ACCESS • CONTROL',
  'VIPKEY • PLATFORM • ONLINE',
  'AGENT • CREDIT • SYNC',
];

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
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 -left-40 h-[32rem] w-[32rem] rounded-full bg-sky-500/25 blur-3xl animate-aurora" />
        <div className="absolute -bottom-32 right-[-12%] h-[30rem] w-[30rem] rounded-full bg-indigo-500/20 blur-3xl animate-orbit" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(79,70,229,0.12),transparent_68%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.85),rgba(15,23,42,0.65),rgba(15,23,42,0.9))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[length:100%_38px] opacity-30" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[length:36px_100%] opacity-20" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent animate-shimmer" />
        <div className="absolute inset-0 translate-y-[-30%] bg-gradient-to-b from-transparent via-sky-400/10 to-transparent opacity-50 animate-scan-slow" />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md md:max-w-lg animate-fade-up">
          <div className="group relative rounded-[38px] bg-gradient-to-br from-sky-500/30 via-blue-500/20 to-indigo-500/35 p-[1.5px] shadow-[0_45px_85px_-45px_rgba(14,165,233,0.9)] backdrop-blur">
            <div className="absolute -inset-[32%] rounded-[48px] bg-gradient-to-br from-sky-500/15 via-blue-500/10 to-indigo-500/15 opacity-60 blur-3xl transition duration-700 group-hover:opacity-90" />
            <div className="absolute inset-0 rounded-[38px] bg-slate-950/85" />
            <Card className="relative overflow-hidden !rounded-[38px] !border-white/10 !bg-slate-950/85 px-8 py-10 text-slate-100">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-10 top-10 flex flex-col gap-2 text-[0.55rem] uppercase tracking-[0.45em] text-sky-200/15">
                  {accentMatrix.map((row, index) => (
                    <span key={row} className="animate-pulse-slow" style={{ animationDelay: `${index * 1.1}s` }}>
                      {row}
                    </span>
                  ))}
                </div>
                <div className="absolute inset-0 rounded-[34px] border border-white/10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_70%)]" />
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent" />
              </div>
              <div className="relative">
                <CardHeader className="!border-none !p-0 text-center">
                  <div className="flex flex-col items-center space-y-5">
                    <div className="relative">
                      <span className="absolute -inset-4 rounded-full bg-sky-500/30 blur-2xl animate-pulse-slow" />
                      <Logo className="h-24 w-24" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.55em] text-sky-300/80">ADMIN BOT CSCODE</p>
                      <CardTitle className="text-3xl font-semibold !text-white">{t('login')}</CardTitle>
                      <div className="flex flex-wrap items-center justify-center gap-2 text-[0.65rem] uppercase tracking-[0.45em] text-sky-300/60">
                        <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1">secure access</span>
                        <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1">cscode</span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        ลงชื่อเข้าใช้งานด้วยข้อมูลที่ได้รับมอบหมายเพื่อเริ่มจัดการระบบได้ทันที
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-8 space-y-6 !border-none !p-0 !text-slate-200">
                  {waitingForAccess ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <div className="h-12 w-12 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
                      <p className="text-sm text-slate-300">{t('maintenanceChecking')}</p>
                    </div>
                  ) : shouldShowMaintenanceView ? (
                    <div className="space-y-5 text-center">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 shadow-lg shadow-blue-500/40">
                        <LockClosedIcon className="h-10 w-10 text-white" />
                      </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-semibold text-white">{t('maintenanceModeTitle')}</h3>
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
                        <div className="mt-8 space-y-4">
                          <p className="text-[0.65rem] uppercase tracking-[0.55em] text-sky-200/80">
                            {t('maintenanceCountdownHeading')}
                          </p>
                          <div className="flex flex-wrap justify-center gap-3">
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
                            ).map((segment) => (
                              <div
                                key={segment.label}
                                className="group relative flex h-24 w-24 flex-col items-center justify-center overflow-hidden rounded-[28px] bg-slate-950/80 ring-1 ring-inset ring-sky-500/35 shadow-[0_28px_55px_-30px_rgba(59,130,246,0.85)] backdrop-blur"
                              >
                                <div className="pointer-events-none absolute -inset-2 rounded-[32px] bg-gradient-to-br from-sky-500/30 via-blue-500/20 to-indigo-500/30 opacity-60 blur-xl transition duration-700 group-hover:opacity-90" />
                                <div className="pointer-events-none absolute inset-px rounded-[24px] bg-slate-900/70" />
                                <div className="relative flex flex-col items-center">
                                  <span className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_18px_35px_rgba(56,189,248,0.55)] animate-[pulse_2.8s_ease-in-out_infinite]">
                                    {segment.value.toString().padStart(2, '0')}
                                  </span>
                                  <span className="mt-2 text-[0.65rem] uppercase tracking-[0.4em] text-slate-300/90">
                                    {segment.label}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button onClick={() => window.location.reload()} className="w-full">
                        {t('maintenanceRefresh')}
                      </Button>
                    </div>
                  ) : (
                    <>
                      {maintenanceActive && ipAllowed && (
                        <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-indigo-500/15 p-4 text-left text-sm text-slate-200 shadow-[0_18px_45px_-30px_rgba(59,130,246,0.65)] backdrop-blur">
                          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-200/90">
                            {t('maintenanceModeTitle')}
                          </p>
                          <p className="mt-2 text-slate-200/80">{t('maintenanceAdminOnly')}</p>
                          {maintenanceScheduleEnd && (
                            <p className="mt-2 text-xs text-slate-300">
                              {t('maintenanceScheduleAutoResume')} {maintenanceScheduleEnd}
                            </p>
                          )}
                        </div>
                      )}
                      <form onSubmit={handleSubmit} className="space-y-5">
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
                          labelClassName="!text-slate-300"
                          className="!bg-slate-900/60 !border-sky-500/30 !text-slate-100 placeholder:text-slate-500 focus:!border-sky-400 focus:!ring-sky-400/60"
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
                          labelClassName="!text-slate-300"
                          className="!bg-slate-900/60 !border-sky-500/30 !text-slate-100 placeholder:text-slate-500 focus:!border-sky-400 focus:!ring-sky-400/60"
                        />
                        <div className="flex items-center justify-between text-sm text-slate-300">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-500/60 bg-slate-900/80 accent-sky-500"
                              checked={remember}
                              onChange={(e) => setRemember(e.target.checked)}
                            />
                            {t('rememberMe')}
                          </label>
                          <a href="#" className="text-sky-200 transition-colors hover:text-sky-100">
                            ลืมรหัสผ่าน?
                          </a>
                        </div>
                        <Button
                          type="submit"
                          className="group relative mt-2 w-full !rounded-xl !px-6 !py-3 overflow-hidden bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 !text-base font-semibold tracking-wide text-white shadow-[0_28px_55px_-28px_rgba(59,130,246,0.85)] transition hover:-translate-y-0.5"
                          disabled={loading}
                        >
                          <span className="relative z-10">{loading ? 'กำลังตรวจสอบ...' : t('login')}</span>
                          <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                            <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(120deg,rgba(255,255,255,0),rgba(255,255,255,0.45),rgba(255,255,255,0))]" />
                          </span>
                        </Button>
                      </form>
                      <p className="text-center text-xs text-slate-400/80">
                        หากต้องการเปลี่ยนรหัสผ่านของแอดมิน สามารถดำเนินการได้ที่เมนู “ตั้งรหัสผ่านใหม่” และใช้รหัสผ่านใหม่ในการเข้าสู่ระบบถัดไป
                      </p>
                    </>
                  )}
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <Modal
        isOpen={showIntroModal}
        onClose={handleIntroAccept}
        title="ยินดีต้อนรับสู่ ADMIN BOT CSCODE"
        disableBackdropClose
        showCloseButton={false}
      >
        <div className="space-y-4 text-center">
          <Logo className="mx-auto h-20 w-20" />
          <div>
            <p className="text-sm font-semibold text-blue-600 tracking-[0.4em] uppercase">ADMIN BOT</p>
            <h3 className="mt-2 text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-500 animate-gradient-x">
              CSCODE
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              แพลตฟอร์มศูนย์กลางสำหรับการจัดการคีย์ที่ทันสมัย โปรดอ่านรายละเอียดสำคัญก่อนเข้าสู่ระบบเพื่อประสบการณ์ที่ดีที่สุด
            </p>
          </div>
          <ul className="space-y-2 text-left text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-blue-500"></span>
              <span>ดูแลการสร้างและจัดการคีย์เฉพาะผู้มีสิทธิ์เท่านั้น</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-cyan-500"></span>
              <span>ระบบบันทึกประวัติการใช้งานเพื่อความปลอดภัยและตรวจสอบย้อนหลัง</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500"></span>
              <span>ปฏิบัติตามนโยบายแพลตฟอร์ม หากพบสิ่งผิดปกติให้ติดต่อผู้ดูแลทันที</span>
            </li>
          </ul>
          <Button onClick={handleIntroAccept} className="w-full">
            เข้าใจแล้ว เริ่มต้นใช้งาน
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;

