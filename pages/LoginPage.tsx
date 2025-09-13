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
    const success = await login(username, password);
    if (success) {
      notify(t('loginSuccess'));
      if (remember) {
        localStorage.setItem('rememberUser', username);
      } else {
        localStorage.removeItem('rememberUser');
      }
    } else {
      notify(t('loginFailed'), 'error');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-slate-200 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="!p-6">
          <div className="flex flex-col items-center">
              <div className="w-16 h-16 p-2 mb-4 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg">
                <Logo className="w-10 h-10" />
              </div>
              <CardTitle className="text-xl">{t('login')}</CardTitle>
              <p className="text-slate-500 mt-1">{t('login')}</p>
          </div>
        </CardHeader>
        <CardContent className="!pt-0">
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
                  onClick={() => setShowPassword(p => !p)}
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
            <Button type="submit" className="w-full !py-2.5 mt-2" disabled={loading}>
              {loading ? 'กำลังตรวจสอบ...' : t('login')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;