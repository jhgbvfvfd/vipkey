import React, { useState } from 'react';
import { useData, useSettings } from '../App';
import { Platform, StandaloneKey } from '../types';
import { addStandaloneKey, updateStandaloneKey, deleteStandaloneKey } from '../services/firebaseService';
import { generateKey } from '../utils/keyGenerator';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
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
        <tr className="border-b border-slate-200 last:border-b-0 odd:bg-white even:bg-slate-50 hover:bg-slate-100">
            <td className="p-2 font-mono text-sm text-blue-600">{apiKey.key}</td>
            <td className="p-2 text-slate-600">{apiKey.platformTitle}</td>
            <td className="p-2 text-slate-600">{apiKey.tokens_remaining.toLocaleString()}</td>
            <td className="p-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    apiKey.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-slate-100 text-slate-800'
                }`}>
                    <svg className={`mr-1.5 h-2 w-2 ${apiKey.status === 'active' ? 'text-green-400' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 8 8">
                        <circle cx={4} cy={4} r={3} />
                    </svg>
                    {apiKey.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                </span>
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
    const [keyGenData, setKeyGenData] = useState({ platformId: platforms[0]?.id || '', tokens: 100 });
    const [error, setError] = useState('');

    const handleGenerateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!keyGenData.platformId) {
            setError('กรุณาเลือกแพลตฟอร์ม');
            return;
        }
        
        const platform = platforms.find(p => p.id === keyGenData.platformId);
        if (!platform) {
            setError('เลือกแพลตฟอร์มไม่ถูกต้อง');
            return;
        }

        try {
            const newKeyString = generateKey(platform.prefix, platform.pattern);
            const newKeyObject: Omit<StandaloneKey, 'id'> & {id: string} = {
                id: `key_${Date.now()}`,
                key: newKeyString,
                tokens_remaining: Number(keyGenData.tokens),
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
    
    React.useEffect(() => {
        if (platforms.length > 0 && !keyGenData.platformId) {
            setKeyGenData(prev => ({ ...prev, platformId: platforms[0].id }));
        }
    }, [platforms, keyGenData.platformId]);

    return (
        <div className="space-y-6">
            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>สร้างคีย์ใหม่</CardTitle>
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
                        <Input label="โทเค็น" type="number" value={keyGenData.tokens} onChange={e => setKeyGenData({...keyGenData, tokens: Number(e.target.value)})} required />
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
                                <th className="p-2 font-semibold">แพลตฟอร์ม</th>
                                <th className="p-2 font-semibold">โทเค็น</th>
                                <th className="p-2 font-semibold">สถานะ</th>
                                <th className="p-2 font-semibold">วันที่สร้าง</th>
                                <th className="p-2 font-semibold text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={6} className="text-center p-4">กำลังโหลดคีย์...</td></tr> : 
                            standaloneKeys.length > 0 ? standaloneKeys.map(k => <KeyRow key={k.id} apiKey={k} onUpdateStatus={handleUpdateKeyStatus} onDelete={confirmDeleteKey} />)
                            : <tr><td colSpan={6} className="text-center p-6 text-slate-500">ยังไม่มีการสร้างคีย์ทั่วไป</td></tr>
                            }
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