import React, { useState, useEffect } from 'react';
import { useAuth, useSettings } from '../App';
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

  const handleIntroAccept = () => {
    localStorage.setItem('vipkey_intro_ack', 'true');
    setShowIntroModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(username, password);
    if (result === 'success') {
      notify(t('loginSuccess'));
      if (remember) {
        localStorage.setItem('rememberUser', username);
      } else {
        localStorage.removeItem('rememberUser');
      }
    } else if (result === 'banned') {
      notify(t('bannedUser'), 'error');
    } else {
      notify(t('loginFailed'), 'error');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 via-sky-500 to-purple-600 p-6">
      <Card className="w-full max-w-md p-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl">
        <CardHeader className="!p-0 mb-6 text-center">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 mb-4 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <Logo className="w-12 h-12" />
            </div>
            <CardTitle className="text-2xl font-bold">{t('login')}</CardTitle>
            <p className="text-slate-500 mt-1">{t('login')}</p>
          </div>
        </CardHeader>
        <CardContent className="!p-0">
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
              leftIcon={<UserIcon className="w-5 h-5" />}
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
              leftIcon={<LockClosedIcon className="w-5 h-5" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              }
            />
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2 rounded border-slate-300"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                {t('rememberMe')}
              </label>
              <a href="#" className="text-blue-600 hover:underline">
                ลืมรหัสผ่าน?
              </a>
            </div>
            <Button type="submit" className="w-full !py-3 mt-4" disabled={loading}>
              {loading ? 'กำลังตรวจสอบ...' : t('login')}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Modal
        isOpen={showIntroModal}
        onClose={handleIntroAccept}
        title="ยินดีต้อนรับสู่ ADMIN BOT CSCODE"
        disableBackdropClose
        showCloseButton={false}
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 shadow-inner shadow-blue-100">
            <Logo className="h-14 w-14" />
          </div>
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

