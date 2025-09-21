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
    RocketLaunchIcon,
    ShieldCheckIcon,
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
            <td className="p-2 font-mono text-xs sm:text-sm text-blue-600 break-all">{apiKey.key}</td>
            <td className="p-2 text-right text-xs sm:text-sm text-slate-600 whitespace-nowrap">{apiKey.tokens_remaining.toLocaleString()}</td>
            <td className="p-2 whitespace-nowrap">
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
            <td className="p-2 text-xs sm:text-sm text-slate-600 whitespace-nowrap">{new Date(apiKey.createdAt).toLocaleDateString('th-TH')}</td>
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
    const [activeMenu, setActiveMenu] = useState<'create' | 'manage'>('create');
    const MIN_TOKENS = 1;
    const MAX_TOKENS = 1000;
    const [tokens, setTokens] = useState(100);
    const [error, setError] = useState('');
    const heroHighlights = [
        {
            title: 'สร้างคีย์รวดเร็ว',
            description: 'สุ่มรูปแบบที่เหมาะสมพร้อมเครดิตครบถ้วนในคลิกเดียว',
            icon: SparklesIcon,
        },
        {
            title: 'ควบคุมเครดิตแม่นยำ',
            description: `จำกัดโทเค็นได้สูงสุด ${MAX_TOKENS.toLocaleString()} ต่อคีย์อย่างละเอียด`,
            icon: ShieldCheckIcon,
        },
        {
            title: 'พร้อมใช้งานทันที',
            description: 'ระบบบันทึกเวลาและสถานะเพื่อพร้อมส่งมอบให้ตัวแทน',
            icon: RocketLaunchIcon,
        },
    ];

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

        const cost = Number(tokens);
        if (!Number.isFinite(cost) || cost < MIN_TOKENS || cost > MAX_TOKENS) {
            setError(`กำหนดโทเค็นได้ระหว่าง ${MIN_TOKENS} - ${MAX_TOKENS}`);
            return;
        }

        try {
            const newKeyString = generateKey(platform.prefix, platform.pattern);
            const newKeyObject: Omit<StandaloneKey, 'id'> & { id: string } = {
                id: `key_${Date.now()}`,
                key: newKeyString,
                tokens_remaining: cost,
                status: 'active',
                createdAt: new Date().toISOString(),
                platformId: platform.id,
                platformTitle: platform.title,
            };
            await addStandaloneKey(newKeyObject);
            refreshData();
            setGeneratedKey(newKeyString);
            setIsModalOpen(true);
            setActiveMenu('manage');
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
    const platformCount = platforms.length;

    return (
        <div className="space-y-7">
            <div className="md:hidden">
                <div className="flex items-center rounded-full border border-white/70 bg-white/95 p-1 text-sm font-medium text-slate-500 shadow-[0_18px_45px_-28px_rgba(59,130,246,0.75)] backdrop-blur">
                    <button
                        className={`flex-1 rounded-full px-3 py-2 transition-all ${activeMenu === 'create' ? 'bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white shadow-[0_18px_35px_-18px_rgba(56,189,248,0.85)]' : 'hover:text-slate-700'}`}
                        onClick={() => setActiveMenu('create')}
                    >
                        สร้างคีย์
                    </button>
                    <button
                        className={`flex-1 rounded-full px-3 py-2 transition-all ${activeMenu === 'manage' ? 'bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white shadow-[0_18px_35px_-18px_rgba(56,189,248,0.85)]' : 'hover:text-slate-700'}`}
                        onClick={() => setActiveMenu('manage')}
                    >
                        จัดการคีย์ที่สร้าง
                    </button>
                </div>
            </div>
            <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] md:items-start">
                <div className={`${activeMenu === 'create' ? 'block' : 'hidden'} md:block`}>
                    <div className="relative overflow-hidden rounded-[36px] border border-white/60 bg-white/90 p-7 shadow-[0_32px_85px_-36px_rgba(59,130,246,0.75)] backdrop-blur">
                        <div className="pointer-events-none absolute -top-24 -left-28 h-64 w-64 rounded-full bg-sky-400/25 blur-3xl animate-aurora" />
                        <div className="pointer-events-none absolute -bottom-28 right-[-18%] h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl animate-orbit" />
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_65%)]" />
                        <div className="relative space-y-7">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/50 bg-sky-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.45em] text-sky-500">
                                        ADMIN BOT
                                    </span>
                                    <h1 className="mt-3 text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400 animate-gradient-x">
                                        CSCODE KEY LAB
                                    </h1>
                                    <p className="mt-2 max-w-md text-sm text-slate-600">
                                        ศูนย์กลางการสร้างคีย์พร้อมควบคุมเครดิตที่ละเอียด เหมาะสำหรับตัวแทนที่ต้องการความรวดเร็วและแม่นยำ
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2 text-xs text-slate-500">
                                    <span className="rounded-full border border-white/60 bg-white/80 px-3 py-1 font-medium text-slate-700 shadow-sm">
                                        {platformCount.toLocaleString()} แพลตฟอร์มพร้อมใช้งาน
                                    </span>
                                    <span className="rounded-full border border-white/60 bg-white/80 px-3 py-1 font-medium text-slate-700 shadow-sm">
                                        จำกัดโทเค็น {MIN_TOKENS.toLocaleString()} - {MAX_TOKENS.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                {heroHighlights.map((feature, index) => {
                                    const Icon = feature.icon;
                                    return (
                                        <div
                                            key={feature.title}
                                            className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-4 shadow-[0_22px_45px_-28px_rgba(59,130,246,0.65)] backdrop-blur transition hover:-translate-y-1"
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                        >
                                            <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-indigo-500/15 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                                            <div className="relative space-y-2">
                                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 text-white shadow-[0_16px_30px_-20px_rgba(56,189,248,0.85)]">
                                                    <Icon className="h-5 w-5" />
                                                </span>
                                                <h3 className="text-sm font-semibold text-slate-800">{feature.title}</h3>
                                                <p className="text-xs leading-5 text-slate-500">{feature.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-inner backdrop-blur">
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">เลือกแพลตฟอร์ม</p>
                                    <h2 className="text-lg font-semibold text-slate-800">เลือกแพลตฟอร์มสำหรับสร้างคีย์ของคุณ</h2>
                                    <div className="pt-1">
                                        <PlatformTabs platforms={platforms} selected={selectedPlatformId} onSelect={setSelectedPlatformId} />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-white/70 bg-white/90 shadow-[0_28px_65px_-38px_rgba(59,130,246,0.75)] backdrop-blur">
                                <div className="flex items-center justify-between rounded-t-[28px] border-b border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-blue-500">ขั้นตอนสุดท้าย</p>
                                        <p className="text-base font-semibold text-slate-800">กำหนดจำนวนโทเค็นและสร้างคีย์</p>
                                    </div>
                                    <div className="hidden sm:flex h-10 items-center justify-center rounded-full border border-sky-500/40 bg-sky-500/10 px-4 text-xs font-semibold text-sky-600">
                                        Key Generator
                                    </div>
                                </div>
                                <div className="px-5 py-5">
                                    <form onSubmit={handleGenerateKey} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Input
                                                label="จำนวนโทเค็นต่อคีย์"
                                                type="number"
                                                min={MIN_TOKENS}
                                                max={MAX_TOKENS}
                                                step={1}
                                                value={tokens}
                                                onChange={e => setTokens(Number(e.target.value))}
                                                required
                                            />
                                            <p className="text-xs text-slate-500">
                                                กำหนดได้ระหว่าง {MIN_TOKENS.toLocaleString()} - {MAX_TOKENS.toLocaleString()} โทเค็นต่อคีย์
                                            </p>
                                        </div>
                                        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-xs text-slate-500">
                                                คีย์จะถูกบันทึกอัตโนมัติพร้อมเวลาและแพลตฟอร์มที่เลือก
                                            </p>
                                            <Button
                                                type="submit"
                                                disabled={platforms.length === 0}
                                                className="group relative !px-6 !py-2.5 !rounded-xl overflow-hidden bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 font-semibold text-white shadow-[0_22px_45px_-24px_rgba(56,189,248,0.85)] transition hover:-translate-y-0.5"
                                            >
                                                <span className="relative z-10">สร้างคีย์ใหม่</span>
                                                <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                                                    <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(120deg,rgba(255,255,255,0),rgba(255,255,255,0.45),rgba(255,255,255,0))]" />
                                                </span>
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`${activeMenu === 'manage' ? 'block' : 'hidden'} md:block`}>
                    <Card className="relative mx-auto h-full max-w-md overflow-hidden rounded-[32px] border-white/70 bg-white/95 shadow-[0_32px_75px_-40px_rgba(15,23,42,0.28)] backdrop-blur sm:max-w-lg md:mx-0 md:max-w-none">
                        <span className="pointer-events-none absolute -top-20 right-[-20%] h-64 w-64 rounded-full bg-sky-400/15 blur-3xl animate-aurora" />
                        <CardHeader className="relative flex flex-col gap-1 rounded-t-[32px] border-b border-white/70 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/15 px-5 py-5">
                            <CardTitle className="text-base font-semibold text-slate-800">คีย์ที่สร้างแล้ว</CardTitle>
                            <p className="text-xs text-slate-500">ตรวจสอบสถานะและจัดการคีย์ของแต่ละแพลตฟอร์มได้จากที่นี่</p>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed text-left text-sm">
                                <thead className="bg-gradient-to-r from-white to-slate-50 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                    <tr>
                                        <th className="w-44 p-3">คีย์</th>
                                        <th className="w-20 p-3 text-right">โทเค็น</th>
                                        <th className="w-28 p-3">สถานะ</th>
                                        <th className="w-32 p-3">วันที่สร้าง</th>
                                        <th className="p-3 text-center">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-6 text-center text-slate-500">กำลังโหลดคีย์...</td></tr>
                                    ) : filteredKeys.length > 0 ? (
                                        filteredKeys.map(k => <KeyRow key={k.id} apiKey={k} onUpdateStatus={handleUpdateKeyStatus} onDelete={confirmDeleteKey} />)
                                    ) : (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-500">ยังไม่มีการสร้างคีย์ทั่วไป</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="สร้างคีย์สำเร็จ">
                <div className="space-y-5">
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4 text-sm text-slate-600">
                        คัดลอกคีย์ด้านล่างเพื่อส่งต่อให้ผู้ใช้งาน คีย์นี้จะแสดงเพียงครั้งเดียวเท่านั้น
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-900/90 p-4 font-mono text-sm tracking-wide text-blue-300 shadow-inner">
                        {generatedKey}
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleModalCopy} className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white">
                            คัดลอกไปยังคลิปบอร์ด
                        </Button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={isConfirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} title="ยืนยันการลบ">
                <div className="space-y-4">
                    <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-600">
                        คุณแน่ใจหรือไม่ว่าต้องการลบคีย์ <strong className="font-semibold text-slate-800 font-mono">{keyToDelete?.key}</strong>? การกระทำนี้ไม่สามารถย้อนกลับได้
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setConfirmDeleteOpen(false)}>ยกเลิก</Button>
                        <Button variant="danger" onClick={handleDeleteKey}>ยืนยันการลบ</Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default GenerateKeyPage;