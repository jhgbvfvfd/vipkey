import React, { useState, useEffect } from 'react';
import { useData, useAuth, useSettings } from '../App';
import { Agent, ApiKey, CreditHistoryEntry } from '../types';
import { updateAgent } from '../services/firebaseService';
import { generateKey } from '../utils/keyGenerator';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

const AgentGenerateKeyPage: React.FC = () => {
    const { platforms, refreshData } = useData();
    const { user, login } = useAuth();
    const { notify, t } = useSettings();
    const agent = user?.data as Agent;

    const [isKeyModalOpen, setKeyModalOpen] = useState(false);
    const [generatedKey, setGeneratedKey] = useState('');
    const [selectedPlatformId, setSelectedPlatformId] = useState(platforms[0]?.id || '');
    const [tokens, setTokens] = useState(100);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (platforms.length > 0 && !selectedPlatformId) {
            setSelectedPlatformId(platforms[0].id);
        }
    }, [platforms, selectedPlatformId]);

    const handleUpdateAgentData = async (updatedAgent: Agent) => {
        await updateAgent(updatedAgent);
        await login(agent.username, agent.password);
        refreshData();
    };

    const handleGenerateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!selectedPlatformId) {
            setError('กรุณาเลือกแพลตฟอร์ม'); setLoading(false); return;
        }
        const platform = platforms.find(p => p.id === selectedPlatformId);
        if (!platform) {
            setError('เลือกแพลตฟอร์มไม่ถูกต้อง'); setLoading(false); return;
        }
        const cost = Number(tokens);
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

            const updatedAgent = JSON.parse(JSON.stringify(agent));
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

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedKey);
            notify(t('copySuccess'));
        } catch (err) {
            notify(t('copyFailed'), 'error');
        }
    };

    return (
    <div className="space-y-6">
            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>{t('generateKeyTitle')}</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">เครดิตของคุณจะถูกใช้เพื่อสร้างคีย์สำหรับแพลตฟอร์มที่เลือก</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleGenerateKey} className="space-y-4">
                        <Select
                            label="แพลตฟอร์ม"
                            value={selectedPlatformId}
                            onChange={e => setSelectedPlatformId(e.target.value)}
                            disabled={platforms.length === 0}
                            required
                        >
                            <option value="" disabled>เลือกแพลตฟอร์ม</option>
                            {platforms.map(platform => (
                                <option key={platform.id} value={platform.id}>{platform.title}</option>
                            ))}
                        </Select>
                        <Input label="โทเค็น (1 เครดิต = 1 โทเค็น)" type="number" value={tokens} onChange={e => setTokens(Number(e.target.value))} required />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={platforms.length === 0 || loading}>
                                {loading ? "กำลังสร้าง..." : "สร้างคีย์"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Modal isOpen={isKeyModalOpen} onClose={() => setKeyModalOpen(false)} title="สร้างคีย์สำเร็จ!">
                <div>
                    <p className="text-slate-600 mb-4">คัดลอกคีย์ด้านล่างนี้ คีย์จะแสดงเพียงครั้งเดียวเท่านั้น</p>
                    <div className="bg-slate-100 p-4 rounded-lg font-mono text-blue-600 break-all border border-slate-200">
                        {generatedKey}
                    </div>
                    <div className="flex justify-between items-center mt-6">
                        <Button variant="secondary" onClick={() => setKeyModalOpen(false)}>ปิด</Button>
                        <Button onClick={handleCopy}>คัดลอกคีย์</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AgentGenerateKeyPage;

