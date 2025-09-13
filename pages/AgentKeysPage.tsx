

import React, { useState, useRef, useEffect } from 'react';
import { useData, useAuth } from '../App';
import { Agent, ApiKey } from '../types';
import { updateAgent } from '../services/firebaseService';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import { KeyIcon } from '@heroicons/react/24/outline';

const KeyRow: React.FC<{ 
    apiKey: ApiKey & { platformId: string, platformTitle: string };
    onUpdateStatus: (key: ApiKey, platformId: string) => void;
    onDelete: (key: ApiKey, platformId: string) => void;
}> = ({ apiKey, onUpdateStatus, onDelete }) => {
    const [copied, setCopied] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const ref = useRef<HTMLTableCellElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey.key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleToggleStatus = () => {
        onUpdateStatus(apiKey, apiKey.platformId);
        setIsMenuOpen(false);
    };

    const handleDelete = () => {
        onDelete(apiKey, apiKey.platformId);
        setIsMenuOpen(false);
    };

    return (
        <tr className="border-b border-slate-200 last:border-b-0 odd:bg-white even:bg-slate-50 hover:bg-slate-100">
            <td className="p-1 font-mono text-sm text-blue-600">{apiKey.key}</td>
            <td className="p-1 text-slate-600">{apiKey.platformTitle}</td>
            <td className="p-1 text-slate-600">{apiKey.tokens_remaining.toLocaleString()}</td>
            <td className="p-1">
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
            <td className="p-1 text-slate-600">{new Date(apiKey.createdAt).toLocaleDateString('th-TH')}</td>
            <td className="p-1 text-right" ref={ref}>
                 <Button variant="secondary" size="sm" onClick={handleCopy} disabled={copied} className="w-24 inline-flex">
                    {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </Button>
                <div className="relative inline-block ml-2">
                    <button onClick={() => setIsMenuOpen(p => !p)} className="p-2 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700 align-middle">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                    </button>
                     {isMenuOpen && (
                        <div className="absolute right-0 bottom-full mb-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 origin-bottom-right text-left">
                            <div className="py-1">
                                <button onClick={handleToggleStatus} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                    {apiKey.status === 'active' ? 'ระงับ' : 'เปิดใช้งาน'}
                                </button>
                                <button onClick={handleDelete} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                    ลบ
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};


const AgentKeysPage: React.FC = () => {
    const { platforms, loading: dataLoading, refreshData } = useData();
    const { user, login } = useAuth();
    const agent = user?.data as Agent;

    const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<{key: ApiKey, platformId: string} | null>(null);

    const platformMap = React.useMemo(() => new Map(platforms.map(p => [p.id, p])), [platforms]);
    const agentKeys = React.useMemo(() => {
        if (!agent || !agent.keys) return [];
        return Object.entries(agent.keys)
            .flatMap(([platformId, keys]) => 
                keys.map(k => ({
                    ...k,
                    platformId,
                    platformTitle: platformMap.get(platformId)?.title || platformId
                }))
            )
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [agent, platformMap]);

    const handleUpdateAgentData = async (updatedAgent: Agent) => {
        await updateAgent(updatedAgent);
        await login(agent.username, agent.password); 
        refreshData();
    };
    
    const handleUpdateKeyStatus = async (keyToUpdate: ApiKey, platformId: string) => {
        const updatedAgent = JSON.parse(JSON.stringify(agent));
        const keysForPlatform = updatedAgent.keys[platformId];
        const keyIndex = keysForPlatform.findIndex((k: ApiKey) => k.key === keyToUpdate.key);
        if (keyIndex > -1) {
            keysForPlatform[keyIndex].status = keysForPlatform[keyIndex].status === 'active' ? 'inactive' : 'active';
            await handleUpdateAgentData(updatedAgent);
        }
    };

    const confirmDeleteKey = (key: ApiKey, platformId: string) => {
        setKeyToDelete({ key, platformId });
        setConfirmDeleteOpen(true);
    };

    const handleDeleteKey = async () => {
        if (!keyToDelete) return;
        const { key, platformId } = keyToDelete;
        const updatedAgent = JSON.parse(JSON.stringify(agent));
        
        let keysForPlatform = updatedAgent.keys[platformId];
        keysForPlatform = keysForPlatform.filter((k: ApiKey) => k.key !== key.key);
        
        if (keysForPlatform.length > 0) {
            updatedAgent.keys[platformId] = keysForPlatform;
        } else {
            delete updatedAgent.keys[platformId];
        }

        await handleUpdateAgentData(updatedAgent);
        setConfirmDeleteOpen(false);
        setKeyToDelete(null);
    };

    return (
        <div className="space-y-6">
            <div>
                <PageHeader
                  icon={<KeyIcon className="w-5 h-5" />}
                  title="คีย์ของฉัน"
                  description="จัดการคีย์ทั้งหมดที่คุณได้สร้างไว้"
                />
            </div>
             <Card className="max-w-md mx-auto">
                <CardHeader><CardTitle>รายการคีย์ทั้งหมด</CardTitle></CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="p-1 font-semibold">คีย์</th>
                                <th className="p-1 font-semibold">แพลตฟอร์ม</th>
                                <th className="p-1 font-semibold">โทเค็น</th>
                                <th className="p-1 font-semibold">สถานะ</th>
                                <th className="p-1 font-semibold">วันที่สร้าง</th>
                                <th className="p-1 font-semibold text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataLoading ? <tr><td colSpan={6} className="text-center p-4">กำลังโหลดคีย์...</td></tr> : 
                            agentKeys.length > 0 ? agentKeys.map(k => <KeyRow key={k.key} apiKey={k} onUpdateStatus={handleUpdateKeyStatus} onDelete={confirmDeleteKey} />)
                            : <tr><td colSpan={6} className="text-center p-6 text-slate-500">คุณยังไม่ได้สร้างคีย์ใดๆ</td></tr>
                            }
                        </tbody>
                    </table>
                </div>
            </Card>

             <Modal isOpen={isConfirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} title="ยืนยันการลบ">
                 <div>
                    <p className="text-slate-600 mb-4">คุณแน่ใจหรือไม่ว่าต้องการลบคีย์ <strong className="font-semibold text-slate-800 font-mono">{keyToDelete?.key.key}</strong>? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setConfirmDeleteOpen(false)}>ยกเลิก</Button>
                        <Button variant="danger" onClick={handleDeleteKey}>ยืนยันการลบ</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AgentKeysPage;