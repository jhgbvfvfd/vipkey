import React, { useState } from 'react';
import { useAuth } from '../App';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Logo from '../components/ui/Logo';
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

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
      toast.success('เข้าสู่ระบบสำเร็จ');
      if (remember) {
        localStorage.setItem('rememberUser', username);
      } else {
        localStorage.removeItem('rememberUser');
      }
    } else {
      toast.error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
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
              <CardTitle className="text-xl">ยินดีต้อนรับ</CardTitle>
              <p className="text-slate-500 mt-1">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
          </div>
        </CardHeader>
        <CardContent className="!pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="username"
              label="ชื่อผู้ใช้"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="กรอกชื่อผู้ใช้ของคุณ"
              required
              disabled={loading}
              leftIcon={<UserIcon className="w-5 h-5" />}
            />
            <Input
              id="password"
              label="รหัสผ่าน"
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
                จำฉันไว้
              </label>
              <a href="#" className="text-blue-600 hover:underline">
                ลืมรหัสผ่าน?
              </a>
            </div>
            <Button type="submit" className="w-full !py-2.5 mt-2" disabled={loading}>
              {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;