import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useSettings, useMaintenance } from '../App';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Logo from '../components/ui/Logo';
import Modal from '../components/ui/Modal';
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const { login } = useAuth();
  const { notify, t } = useSettings();
  const { config: maintenanceConfig, loading: maintenanceLoading } = useMaintenance();
  const [clientIp, setClientIp] = useState<string | null>(null);
  const [ipLoading, setIpLoading] = useState(true);
  const [blockedByMaintenance, setBlockedByMaintenance] = useState(false);

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

  useEffect(() => {
    if (!maintenanceConfig.enabled) {
      setBlockedByMaintenance(false);
    }
  }, [maintenanceConfig.enabled]);

  const allowedIps = useMemo(() => maintenanceConfig.allowedAdminIps ?? [], [maintenanceConfig.allowedAdminIps]);
  const ipAllowed = useMemo(() => {
    if (!clientIp) return false;
    return allowedIps.includes(clientIp.trim());
  }, [allowedIps, clientIp]);
  const maintenanceActive = maintenanceConfig.enabled;
  const waitingForAccess = maintenanceActive && !blockedByMaintenance && !ipAllowed && (maintenanceLoading || ipLoading);
  const maintenanceMessage = maintenanceConfig.message?.trim() || t('maintenanceDefaultMessage');
  const shouldShowMaintenanceView = maintenanceActive && !waitingForAccess && (!ipAllowed || blockedByMaintenance);

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
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-sky-500/30 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-[26rem] w-[26rem] rounded-full bg-purple-500/25 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-950 to-slate-900/80" />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at top, rgba(14,165,233,0.18), transparent 60%)' }}
        />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-up">
          <div className="rounded-[32px] bg-gradient-to-br from-sky-500/35 via-blue-500/25 to-indigo-500/40 p-[1px] shadow-[0_35px_65px_-25px_rgba(14,165,233,0.55)] backdrop-blur">
            <Card className="relative overflow-hidden !rounded-[32px] !border-white/10 !bg-slate-950/85 p-8 text-slate-100">
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(circle at top, rgba(59,130,246,0.16), transparent 72%)' }}
              />
              <div className="relative">
                <CardHeader className="!border-none !p-0 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <Logo className="h-24 w-24" />
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.55em] text-sky-300/90">ADMIN BOT CSCODE</p>
                      <CardTitle className="text-3xl font-semibold !text-white">{t('login')}</CardTitle>
                      <p className="text-sm text-slate-400">
                        ลงชื่อเข้าใช้งานด้วยข้อมูลที่ได้รับมอบหมายเพื่อเริ่มจัดการระบบได้ทันที
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-6 space-y-5 !border-none !p-0 !text-slate-200">
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
                        <p className="text-xs text-slate-500">
                          {t('maintenanceYourIp')}{' '}
                          <span className="font-mono text-slate-200">{clientIp && clientIp.length > 0 ? clientIp : '-'}</span>
                        </p>
                      </div>
                      <Button onClick={() => window.location.reload()} className="w-full">
                        {t('maintenanceRefresh')}
                      </Button>
                    </div>
                  ) : (
                    <>
                      {maintenanceActive && ipAllowed && (
                        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-left text-sm text-slate-200">
                          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-200/90">
                            {t('maintenanceModeTitle')}
                          </p>
                          <p className="mt-2 text-slate-200/80">{t('maintenanceAdminOnly')}</p>
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
                          <a href="#" className="text-sky-300 transition-colors hover:text-sky-200">
                            ลืมรหัสผ่าน?
                          </a>
                        </div>
                        <Button
                          type="submit"
                          className="mt-2 w-full !py-3 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 !text-base tracking-wide text-white shadow-[0_20px_45px_-18px_rgba(56,189,248,0.7)] transition [box-shadow:0px_18px_35px_-20px_rgba(59,130,246,0.8)] hover:from-sky-400 hover:via-blue-500 hover:to-indigo-600 focus:!ring-sky-300/60"
                          disabled={loading}
                        >
                          {loading ? 'กำลังตรวจสอบ...' : t('login')}
                        </Button>
                      </form>
                      <p className="text-center text-xs text-slate-400">
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

