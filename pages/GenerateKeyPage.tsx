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
        <tr className="border-b border-slate-200 last:border-b-0">
            <td className="p-2 font-mono text-xs sm:text-sm text-slate-700 break-all">{apiKey.key}</td>
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
                    return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
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

    return (
        <div className="space-y-6">
            <div className="md:hidden">
                <div className="flex items-center rounded-md border border-slate-200 bg-white p-1 text-sm font-medium text-slate-600 shadow-sm">
                    <button
                        className={`flex-1 rounded-md px-3 py-2 transition ${activeMenu === 'create' ? 'bg-sky-500 text-white shadow-sm' : 'hover:bg-slate-100'}`}
                        onClick={() => setActiveMenu('create')}
                    >
                        สร้างคีย์
                    </button>
                    <button
                        className={`flex-1 rounded-md px-3 py-2 transition ${activeMenu === 'manage' ? 'bg-sky-500 text-white shadow-sm' : 'hover:bg-slate-100'}`}
                        onClick={() => setActiveMenu('manage')}
                    >
                        จัดการคีย์ที่สร้าง
                    </button>
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 md:items-start">
                <div className={`${activeMenu === 'create' ? 'block' : 'hidden'} md:block`}>
                    <Card>
                        <CardHeader>
                            <CardTitle>สร้างคีย์สำหรับแพลตฟอร์ม</CardTitle>
                            <p className="text-sm text-slate-500">เลือกแพลตฟอร์มและจำนวนโทเค็นที่ต้องการก่อนสร้างคีย์</p>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-slate-700">เลือกแพลตฟอร์ม</p>
                                <PlatformTabs platforms={platforms} selected={selectedPlatformId} onSelect={setSelectedPlatformId} />
                            </div>
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
                                {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-slate-500">
                                        คีย์ที่สร้างจะถูกบันทึกอัตโนมัติพร้อมสถานะเริ่มต้นเป็นเปิดใช้งาน
                                    </p>
                                    <Button type="submit" disabled={platforms.length === 0}>
                                        สร้างคีย์ใหม่
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className={`${activeMenu === 'manage' ? 'block' : 'hidden'} md:block`}>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>จัดการคีย์ที่สร้าง</CardTitle>
                            <p className="text-sm text-slate-500">ตรวจสอบสถานะคีย์และปรับการใช้งานได้จากที่นี่</p>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed text-left text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">คีย์ถูกสร้างและบันทึกเรียบร้อย สามารถคัดลอกเพื่อใช้งานได้ทันที</p>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-700 break-all">
                        {generatedKey}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>ปิด</Button>
                        <Button onClick={handleModalCopy}>คัดลอกคีย์</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isConfirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} title="ยืนยันการลบคีย์">
                <div className="space-y-4 text-sm text-slate-600">
                    <p>ต้องการลบคีย์นี้หรือไม่ การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700 break-all">
                        {keyToDelete?.key}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setConfirmDeleteOpen(false)}>ยกเลิก</Button>
                        <Button variant="danger" onClick={handleDeleteKey}>ลบคีย์</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default GenerateKeyPage;
