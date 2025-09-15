import React, { useState } from 'react';
import { useAuth, useSettings } from '../App';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Logo from '../components/ui/Logo';
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { notify, t } = useSettings();

  React.useEffect(() => {
    const remembered = localStorage.getItem('rememberUser');
    if (remembered) {
      setUsername(remembered);
      setRemember(true);
    }
  }, []);

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
    </div>
  );
};

export default LoginPage;

