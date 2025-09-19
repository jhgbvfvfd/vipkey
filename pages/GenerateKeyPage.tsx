import React, { useState, useEffect } from 'react';
import { useData, useSettings } from '../App';
import { StandaloneKey } from '../types';
import { addStandaloneKey, updateStandaloneKey, deleteStandaloneKey } from '../services/firebaseService';
import { generateKey } from '../utils/keyGenerator';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import PlatformTabs from '../components/ui/PlatformTabs';
import {
    ClipboardIcon,
    CheckIcon,
    PauseIcon,
    PlayIcon,
    TrashIcon,
    SparklesIcon,
    ShieldCheckIcon,
    BoltIcon,
} from '@heroicons/react/24/outline';

const KeyRow: React.FC<{ 
    apiKey: StandaloneKey;
    onUpdateStatus: (key: StandaloneKey, status: 'active' | 'inactive') => void;
    onDelete: (key: StandaloneKey) => void;
}> = ({ apiKey, onUpdateStatus, onDelete }) => {
    const [copied, setCopied] = useState(false);
    const { notify, t } = useSettings();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(apiKey.key);
            setCopied(true);
            notify(t('copySuccess'));
        } catch (err) {
            notify(t('copyFailed'), 'error');
        } finally {
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleToggleStatus = () => {
        const newStatus = apiKey.status === 'active' ? 'inactive' : 'active';
        onUpdateStatus(apiKey, newStatus);
    };

    const handleDelete = () => {
        onDelete(apiKey);
    };

    return (
        <tr className="border-b border-slate-200 last:border-b-0 odd:bg-white even:bg-slate-50 hover:bg-slate-100">
            <td className="p-2 font-mono text-sm text-blue-600">{apiKey.key}</td>
            <td className="p-2 text-slate-600">{apiKey.tokens_remaining.toLocaleString()}</td>
            <td className="p-2">
                {(() => {
                    const statusKey = apiKey.tokens_remaining <= 0
                        ? 'statusNoTokens'
                        : apiKey.status === 'active'
                            ? 'statusActive'
                            : 'statusInactive';
                    const statusColor = apiKey.tokens_remaining <= 0
                        ? 'bg-red-100 text-red-800'
                        : apiKey.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-800';
                    const dotColor = apiKey.tokens_remaining <= 0
                        ? 'text-red-400'
                        : apiKey.status === 'active'
                            ? 'text-green-400'
                            : 'text-slate-400';
                    return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                            <svg className={`mr-1.5 h-2 w-2 ${dotColor}`} fill="currentColor" viewBox="0 0 8 8">
                                <circle cx={4} cy={4} r={3} />
                            </svg>
                            {t(statusKey as any)}
                        </span>
                    );
                })()}
            </td>
            <td className="p-2 text-slate-600">{new Date(apiKey.createdAt).toLocaleDateString('th-TH')}</td>
            <td className="p-2 text-center">
                <div className="inline-flex items-center justify-center gap-1">
                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700"
                        title={copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                    >
                        {copied ? (
                            <CheckIcon className="w-4 h-4 text-green-600" />
                        ) : (
                            <ClipboardIcon className="w-4 h-4" />
                        )}
                    </button>
                    <button
                        onClick={handleToggleStatus}
                        className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700"
                        title={apiKey.status === 'active' ? 'ระงับคีย์' : 'เปิดใช้งาน'}
                    >
                        {apiKey.status === 'active' ? (
                            <PauseIcon className="w-4 h-4" />
                        ) : (
                            <PlayIcon className="w-4 h-4" />
                        )}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 rounded-md hover:bg-red-100 text-red-600 hover:text-red-700"
                        title="ลบคีย์"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};


const GenerateKeyPage: React.FC = () => {
    const { platforms, standaloneKeys, loading, refreshData } = useData();
    const { notify, t } = useSettings();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<StandaloneKey | null>(null);
    const [generatedKey, setGeneratedKey] = useState('');
    const [selectedPlatformId, setSelectedPlatformId] = useState(platforms[0]?.id || '');
    const [tokens, setTokens] = useState(100);
    const [error, setError] = useState('');

    const handleGenerateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!selectedPlatformId) {
            setError('กรุณาเลือกแพลตฟอร์ม');
            return;
        }

        const platform = platforms.find(p => p.id === selectedPlatformId);
        if (!platform) {
            setError('เลือกแพลตฟอร์มไม่ถูกต้อง');
            return;
        }

        try {
            const newKeyString = generateKey(platform.prefix, platform.pattern);
            const newKeyObject: Omit<StandaloneKey, 'id'> & { id: string } = {
                id: `key_${Date.now()}`,
                key: newKeyString,
                tokens_remaining: Number(tokens),
                status: 'active',
                createdAt: new Date().toISOString(),
                platformId: platform.id,
                platformTitle: platform.title,
            };
            await addStandaloneKey(newKeyObject);
            refreshData();
            setGeneratedKey(newKeyString);
            setIsModalOpen(true);
            notify('สร้างคีย์เรียบร้อย');
        } catch (err) {
            setError('ไม่สามารถสร้างคีย์ได้');
            console.error(err);
            notify('ไม่สามารถสร้างคีย์ได้', 'error');
        }
    };

    const handleUpdateKeyStatus = async (key: StandaloneKey, status: 'active' | 'inactive') => {
        const updatedKey = { ...key, status };
        await updateStandaloneKey(updatedKey);
        refreshData();
        notify(status === 'active' ? 'เปิดใช้งานคีย์แล้ว' : 'ระงับคีย์แล้ว');
    };

    const confirmDeleteKey = (key: StandaloneKey) => {
        setKeyToDelete(key);
        setConfirmDeleteOpen(true);
    };

    const handleDeleteKey = async () => {
        if (!keyToDelete) return;
        try {
            await deleteStandaloneKey(keyToDelete.id);
            refreshData();
            setConfirmDeleteOpen(false);
            setKeyToDelete(null);
            notify('ลบคีย์แล้ว');
        } catch (err) {
            notify('ลบคีย์ไม่สำเร็จ', 'error');
        }
    };

    const handleModalCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedKey);
            notify(t('copySuccess'));
        } catch (err) {
            notify(t('copyFailed'), 'error');
        }
    };
    
    useEffect(() => {
        if (platforms.length > 0 && !selectedPlatformId) {
            setSelectedPlatformId(platforms[0].id);
        }
    }, [platforms, selectedPlatformId]);

    const filteredKeys = standaloneKeys.filter(k => k.platformId === selectedPlatformId);

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#050818] via-[#0f172a] to-[#1e3a8a] text-white shadow-2xl shadow-blue-900/40">
                <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_70%)]"></div>
                <div className="absolute -top-20 -right-24 h-44 w-44 rounded-full bg-sky-500/40 blur-3xl animate-float"></div>
                <div className="absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-blue-400/30 blur-3xl animate-float [animation-delay:1.5s]"></div>
                <div className="relative z-10 px-6 py-8 sm:px-10">
                    <p className="text-xs uppercase tracking-[0.6em] text-blue-200/80">ADMIN BOT</p>
                    <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-sky-500 animate-gradient-x">CSCODE</span>
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm text-slate-200/90">
                        ศูนย์ควบคุมการสร้างคีย์ที่ออกแบบมาเพื่อให้คุณจัดการแพลตฟอร์มได้อย่างเหนือระดับ พร้อมเอฟเฟกต์และประสบการณ์ที่ลื่นไหลในทุกขั้นตอน
                    </p>
                    <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                            <ShieldCheckIcon className="h-6 w-6 text-cyan-300" />
                            <div>
                                <p className="font-semibold">ความปลอดภัยเต็มระดับ</p>
                                <p className="text-xs text-slate-200/80">มั่นใจด้วยการควบคุมสถานะคีย์อย่างละเอียด</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                            <BoltIcon className="h-6 w-6 text-sky-300" />
                            <div>
                                <p className="font-semibold">สร้างคีย์รวดเร็ว</p>
                                <p className="text-xs text-slate-200/80">เลือกแพลตฟอร์มแล้วสร้างคีย์ได้ทันที</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                            <SparklesIcon className="h-6 w-6 text-blue-200" />
                            <div>
                                <p className="font-semibold">ประสบการณ์ล้ำสมัย</p>
                                <p className="text-xs text-slate-200/80">ดีไซน์ใหม่พร้อมเอฟเฟกต์สวยเท่ทุกครั้งที่ใช้งาน</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-lg shadow-slate-200/50 backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-blue-500 font-semibold">เลือกแพลตฟอร์ม</p>
                        <h2 className="text-lg font-semibold text-slate-800">เลือกแพลตฟอร์มสำหรับสร้างคีย์ของคุณ</h2>
                    </div>
                    <span className="inline-flex items-center gap-2 self-start rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 shadow-sm animate-fade-up">
                        <SparklesIcon className="h-4 w-4" />
                        แตะเพื่อปลดล็อกการสร้างคีย์
                    </span>
                </div>
                <div className="mt-3">
                    <PlatformTabs platforms={platforms} selected={selectedPlatformId} onSelect={setSelectedPlatformId} />
                </div>
            </div>
            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>สร้างคีย์ใหม่</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleGenerateKey} className="space-y-4">
                        <Input label="โทเค็น" type="number" value={tokens} onChange={e => setTokens(Number(e.target.value))} required />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={platforms.length === 0}>สร้าง</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>คีย์ที่สร้างแล้ว</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="p-2 font-semibold">คีย์</th>
                                <th className="p-2 font-semibold">โทเค็น</th>
                                <th className="p-2 font-semibold">สถานะ</th>
                                <th className="p-2 font-semibold">วันที่สร้าง</th>
                                <th className="p-2 font-semibold text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center p-4">กำลังโหลดคีย์...</td></tr>
                            ) : filteredKeys.length > 0 ? (
                                filteredKeys.map(k => <KeyRow key={k.id} apiKey={k} onUpdateStatus={handleUpdateKeyStatus} onDelete={confirmDeleteKey} />)
                            ) : (
                                <tr><td colSpan={5} className="text-center p-6 text-slate-500">ยังไม่มีการสร้างคีย์ทั่วไป</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="สร้างคีย์สำเร็จ">
                <div>
                    <p className="text-slate-600 mb-4">คัดลอกคีย์ด้านล่างนี้ คีย์จะแสดงเพียงครั้งเดียวเท่านั้น</p>
                    <div className="bg-slate-100 p-4 rounded-lg font-mono text-blue-600 break-all border border-slate-200">
                        {generatedKey}
                    </div>
                     <div className="flex justify-end mt-6">
                        <Button onClick={handleModalCopy}>คัดลอกไปยังคลิปบอร์ด</Button>
                    </div>
                </div>
            </Modal>
             <Modal isOpen={isConfirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} title="ยืนยันการลบ">
                 <div>
                    <p className="text-slate-600 mb-4">คุณแน่ใจหรือไม่ว่าต้องการลบคีย์ <strong className="font-semibold text-slate-800 font-mono">{keyToDelete?.key}</strong>? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setConfirmDeleteOpen(false)}>ยกเลิก</Button>
                        <Button variant="danger" onClick={handleDeleteKey}>ยืนยันการลบ</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default GenerateKeyPage;