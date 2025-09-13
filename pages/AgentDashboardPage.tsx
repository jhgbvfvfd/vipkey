
import React, { useState } from 'react';
import { useData, useAuth } from '../App';
import { Agent, ApiKey, CreditHistoryEntry } from '../types';
import { updateAgent } from '../services/firebaseService';
import { generateKey } from '../utils/keyGenerator';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import { HomeIcon } from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const AgentDashboardPage: React.FC = () => {
    const { platforms, refreshData } = useData();
    const { user, login } = useAuth(); // We need login to refresh user data in context
    const agent = user?.data as Agent;
    const keysByPlatform = agent.keys || {};
    const allKeys = Object.values(keysByPlatform).flat();
    const totalTokens = allKeys.reduce((sum, k) => sum + k.tokens_remaining, 0);
    const totalKeys = allKeys.length;
    const creditHistory = agent.creditHistory || [];

    const chartData = {
        labels: creditHistory.map(h => new Date(h.date).toLocaleDateString('th-TH')),
        datasets: [
            {
                label: 'เครดิตคงเหลือ',
                data: creditHistory.map(h => h.balanceAfter),
                borderColor: 'rgb(59,130,246)',
                backgroundColor: 'rgba(59,130,246,0.3)',
            },
        ],
    };

    const [isKeyModalOpen, setKeyModalOpen] = useState(false);
    const [generatedKey, setGeneratedKey] = useState('');
    const [keyGenData, setKeyGenData] = useState({ platformId: platforms[0]?.id || '', tokens: 100 });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    React.useEffect(() => {
        if (platforms.length > 0 && !keyGenData.platformId) {
            setKeyGenData(prev => ({ ...prev, platformId: platforms[0].id }));
        }
    }, [platforms, keyGenData.platformId]);

    const handleUpdateAgentData = async (updatedAgent: Agent) => {
        await updateAgent(updatedAgent);
        // Refresh auth context and data context
        await login(agent.username, agent.password); 
        refreshData();
    };

    const handleGenerateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!keyGenData.platformId) {
            setError('กรุณาเลือกแพลตฟอร์ม'); setLoading(false); return;
        }
        const platform = platforms.find(p => p.id === keyGenData.platformId);
        if (!platform) {
            setError('เลือกแพลตฟอร์มไม่ถูกต้อง'); setLoading(false); return;
        }
        const cost = Number(keyGenData.tokens);
        if (agent.credits < cost) {
            setError(`เครดิตไม่เพียงพอ คุณมี ${agent.credits}, แต่ต้องการ ${cost}`); setLoading(false); return;
        }

        try {
            const newKeyString = generateKey(platform.prefix, platform.pattern);
            const newKeyObject: ApiKey = {
                key: newKeyString,
                tokens_remaining: cost,
                status: 'active',
                createdAt: new Date().toISOString(),
            };

            const updatedAgent = JSON.parse(JSON.stringify(agent)); // Deep copy
            const newBalance = agent.credits - cost;
            updatedAgent.credits = newBalance;
            const newHistoryEntry: CreditHistoryEntry = {
                date: new Date().toISOString(),
                action: `สร้างคีย์สำหรับ ${platform.title}`, amount: -cost, balanceAfter: newBalance,
            };
            updatedAgent.creditHistory = [...(updatedAgent.creditHistory || []), newHistoryEntry];
            if (!updatedAgent.keys) updatedAgent.keys = {};
            if (!updatedAgent.keys[platform.id]) updatedAgent.keys[platform.id] = [];
            updatedAgent.keys[platform.id].push(newKeyObject);

            await handleUpdateAgentData(updatedAgent);
            setGeneratedKey(newKeyString);
            setKeyModalOpen(true);
        } catch (err) {
            setError('ไม่สามารถสร้างคีย์ได้'); console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
              icon={<HomeIcon className="w-5 h-5" />}
              title="แดชบอร์ด"
              description={`ยินดีต้อนรับ, ${agent.username}! ดูภาพรวมและจัดการคีย์ของคุณ`}
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="!pb-2"><CardTitle>เครดิตคงเหลือ</CardTitle></CardHeader>
                    <CardContent className="!pt-0"><p className="text-xl font-bold text-blue-600">{agent.credits.toLocaleString()}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="!pb-2"><CardTitle>จำนวนคีย์ทั้งหมด</CardTitle></CardHeader>
                    <CardContent className="!pt-0"><p className="text-xl font-bold text-blue-600">{totalKeys}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="!pb-2"><CardTitle>โทเค็นคงเหลือรวม</CardTitle></CardHeader>
                    <CardContent className="!pt-0"><p className="text-xl font-bold text-blue-600">{totalTokens.toLocaleString()}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="!pb-2"><CardTitle>แพลตฟอร์มที่ใช้งาน</CardTitle></CardHeader>
                    <CardContent className="!pt-0"><p className="text-xl font-bold text-blue-600">{Object.keys(keysByPlatform).length}</p></CardContent>
                </Card>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>สร้างคีย์ใหม่</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">เครดิตของคุณจะถูกใช้เพื่อสร้างคีย์สำหรับแพลตฟอร์มที่เลือก</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleGenerateKey} className="space-y-4">
                        <div>
                            <label htmlFor="platform" className="block text-sm font-medium text-slate-700 mb-1.5">แพลตฟอร์ม</label>
                            <select
                                id="platform"
                                value={keyGenData.platformId}
                                onChange={e => setKeyGenData({...keyGenData, platformId: e.target.value})}
                                className="block w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                disabled={platforms.length === 0}
                            >
                                {platforms.length > 0 ? platforms.map(p => <option key={p.id} value={p.id}>{p.title}</option>) : <option>ไม่มีแพลตฟอร์ม</option>}
                            </select>
                        </div>
                        <Input label="โทเค็น (1 เครดิต = 1 โทเค็น)" type="number" value={keyGenData.tokens} onChange={e => setKeyGenData({...keyGenData, tokens: Number(e.target.value)})} required />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={platforms.length === 0 || loading}>
                                {loading ? "กำลังสร้าง..." : "สร้างคีย์"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {creditHistory.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>กราฟเครดิตคงเหลือ</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                    </CardContent>
                </Card>
            )}

            <Modal isOpen={isKeyModalOpen} onClose={() => setKeyModalOpen(false)} title="สร้างคีย์สำเร็จ!">
                <div>
                    <p className="text-slate-600 mb-4">คัดลอกคีย์ด้านล่างนี้ คีย์จะแสดงเพียงครั้งเดียวเท่านั้น</p>
                    <div className="bg-slate-100 p-4 rounded-lg font-mono text-blue-600 break-all border border-slate-200">
                        {generatedKey}
                    </div>
                    <div className="flex justify-between items-center mt-6">
                        <Button variant="secondary" onClick={() => setKeyModalOpen(false)}>ปิด</Button>
                        <Button onClick={() => navigator.clipboard.writeText(generatedKey)}>คัดลอกคีย์</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AgentDashboardPage;
