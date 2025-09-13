import React, { useState } from 'react';
import { useAuth } from '../App';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Logo from '../components/ui/Logo';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(username, password);
    if (!success) {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
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
            />
            <Input
              id="password"
              label="รหัสผ่าน"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
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