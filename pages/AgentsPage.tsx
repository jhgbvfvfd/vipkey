

import React, { useState } from 'react';
import { useData } from '../App';
import { Agent, Platform, CreditHistoryEntry, ApiKey } from '../types';
import { addAgent, updateAgent } from '../services/firebaseService';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const AgentCard: React.FC<{ 
    agent: Agent; 
    onViewHistory: (agent: Agent) => void; 
    onManageKeys: (agent: Agent) => void;
    onAddCredits: (agent: Agent) => void;
    platforms: Platform[] 
}> = ({ agent, onViewHistory, onManageKeys, onAddCredits, platforms }) => {
    const platformMap = new Map(platforms.map(p => [p.id, p]));

    return (
        <Card>
            <CardHeader className="flex justify-between items-start">
                <div>
                    <CardTitle>{agent.username}</CardTitle>
                    <p className="text-xs text-slate-400 font-mono mt-1">{agent.id}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{agent.credits.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">เครดิตคงเหลือ</p>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2 mb-4">
                    <Button onClick={() => onAddCredits(agent)} className="w-full">เติมเครดิต</Button>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={() => onViewHistory(agent)} variant="secondary" className="w-full">ดูประวัติเครดิต</Button>
                        <Button onClick={() => onManageKeys(agent)} variant="secondary" className="w-full">จัดการคีย์</Button>
                    </div>
                </div>
                <h4 className="font-semibold text-slate-600 mb-2 text-sm">คีย์ล่าสุดที่สร้าง:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 rounded-lg bg-slate-50 border border-slate-200">
                {agent.keys && Object.keys(agent.keys).length > 0 ? (
                    Object.entries(agent.keys).flatMap(([platformId, keys]) => 
                        keys.map(k => ({...k, platformTitle: platformMap.get(platformId)?.title || platformId }))
                    )
                    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5) // Show latest 5 keys across all platforms
                    .map(k => (
                        <div key={k.key} className="text-xs font-mono bg-white p-2 rounded border border-slate-200">
                            <p className="text-blue-600 truncate">{k.key}</p>
                            <div className="flex justify-between text-slate-500 mt-1">
                                <span>{k.platformTitle}</span>
                                <span>{k.tokens_remaining.toLocaleString()} โทเค็น</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-slate-400 text-center py-4">ยังไม่มีคีย์ที่สร้าง</p>
                )}
                </div>
            </CardContent>
        </Card>
    );
};


const ManageKeysModal: React.FC<{
    agent: Agent | null; 
    platforms: Platform[];
    isOpen: boolean; 
    onClose: () => void;
    onUpdateAgent: (agent: Agent) => Promise<void>;
}> = ({ agent, platforms, isOpen, onClose, onUpdateAgent }) => {
    const [keyToConfirmDelete, setKeyToConfirmDelete] = useState<{key: ApiKey, platformId: string} | null>(null);
    if (!agent) return null;

    const platformMap = new Map(platforms.map(p => [p.id, p]));
    const agentKeys = Object.entries(agent.keys || {}).flatMap(([platformId, keys]) => 
        keys.map(k => ({ ...k, platformId, platformTitle: platformMap.get(platformId)?.title || platformId }))
    ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleUpdateStatus = async (keyToUpdate: ApiKey, platformId: string) => {
        const updatedAgent = { ...agent, keys: { ...agent.keys } };
        const keysForPlatform = [...(updatedAgent.keys[platformId] || [])];
        const keyIndex = keysForPlatform.findIndex(k => k.key === keyToUpdate.key);
        if (keyIndex > -1) {
            keysForPlatform[keyIndex] = { ...keysForPlatform[keyIndex], status: keyToUpdate.status === 'active' ? 'inactive' : 'active' };
            updatedAgent.keys[platformId] = keysForPlatform;
            await onUpdateAgent(updatedAgent);
            toast.success(keyToUpdate.status === 'active' ? 'ระงับคีย์แล้ว' : 'เปิดใช้งานคีย์แล้ว');
        }
    };

    const handleDelete = async () => {
        if (!keyToConfirmDelete) return;
        const { key: keyToDelete, platformId } = keyToConfirmDelete;

        const updatedAgent = { ...agent, keys: { ...agent.keys } };
        let keysForPlatform = [...(updatedAgent.keys[platformId] || [])];
        keysForPlatform = keysForPlatform.filter(k => k.key !== keyToDelete.key);
        
        if(keysForPlatform.length > 0) {
            updatedAgent.keys[platformId] = keysForPlatform;
        } else {
            delete updatedAgent.keys[platformId];
        }
        
        await onUpdateAgent(updatedAgent);
        setKeyToConfirmDelete(null);
        toast.success('ลบคีย์แล้ว');
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`จัดการคีย์สำหรับ ${agent.username}`}>
                <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-slate-50 text-slate-500">
                             <tr>
                                <th className="p-1 font-semibold">คีย์</th>
                                <th className="p-1 font-semibold">แพลตฟอร์ม</th>
                                <th className="p-1 font-semibold">สถานะ</th>
                                <th className="p-1 font-semibold text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agentKeys.length > 0 ? agentKeys.map(k => (
                                <tr key={k.key} className="border-b border-slate-200 last:border-b-0">
                                    <td className="p-1 font-mono text-xs text-blue-600">{k.key}</td>
                                    <td className="p-1">{k.platformTitle}</td>
                                    <td className="p-1">{k.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}</td>
                                    <td className="p-1 text-center">
                                         <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(k, k.platformId)} className="mr-2">
                                            {k.status === 'active' ? 'ระงับ' : 'เปิด'}
                                        </Button>
                                        <Button size="sm" variant="danger" onClick={() => setKeyToConfirmDelete({key: k, platformId: k.platformId})}>
                                            ลบ
                                        </Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="text-center p-6 text-slate-500">ไม่พบคีย์</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
                    <Button variant="secondary" onClick={onClose}>ปิด</Button>
                </div>
            </Modal>
             <Modal isOpen={!!keyToConfirmDelete} onClose={() => setKeyToConfirmDelete(null)} title="ยืนยันการลบ">
                 <div>
                    <p className="text-slate-600 mb-4">คุณแน่ใจหรือไม่ว่าต้องการลบคีย์ <strong className="font-semibold text-slate-800 font-mono">{keyToConfirmDelete?.key.key}</strong>? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setKeyToConfirmDelete(null)}>ยกเลิก</Button>
                        <Button variant="danger" onClick={handleDelete}>ยืนยันการลบ</Button>
                    </div>
                </div>
            </Modal>
        </>
    )
};


const AgentsPage: React.FC = () => {
    const { agents, platforms, loading, refreshData } = useData();
    const [isAddAgentModalOpen, setAddAgentModalOpen] = useState(false);
    const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
    const [isKeysModalOpen, setKeysModalOpen] = useState(false);
    const [isAddCreditsModalOpen, setAddCreditsModalOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [newAgentData, setNewAgentData] = useState({ username: '', password: '', credits: 1000 });
    const [creditsToAdd, setCreditsToAdd] = useState(100);
    const [error, setError] = useState('');

    const handleAddAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (agents.some(u => u.username.toLowerCase() === newAgentData.username.toLowerCase())) {
            setError("ชื่อผู้ใช้นี้มีอยู่แล้ว");
            return;
        }
        if (!newAgentData.password) {
            setError("กรุณาตั้งรหัสผ่าน");
            return;
        }

        try {
            const newId = `agent_${Date.now()}`;
            const initialCredits = Number(newAgentData.credits);
            
            const initialHistoryEntry: CreditHistoryEntry = {
                date: new Date().toISOString(),
                action: 'เครดิตเริ่มต้น',
                amount: initialCredits,
                balanceAfter: initialCredits,
            };

            await addAgent({
                id: newId,
                username: newAgentData.username,
                password: newAgentData.password,
                credits: initialCredits,
                createdAt: new Date().toISOString(),
                keys: {},
                creditHistory: [initialHistoryEntry],
            });
            refreshData();
            setAddAgentModalOpen(false);
            setNewAgentData({ username: '', password: '', credits: 1000 });
            toast.success('สร้างตัวแทนเรียบร้อย');
        } catch (err) {
            setError('ไม่สามารถเพิ่มตัวแทนได้');
            console.error(err);
            toast.error('ไม่สามารถเพิ่มตัวแทนได้');
        }
    };
    
    const handleOpenHistory = (agent: Agent) => {
        setSelectedAgent(agent);
        setHistoryModalOpen(true);
    };

    const handleOpenKeys = (agent: Agent) => {
        setSelectedAgent(agent);
        setKeysModalOpen(true);
    };
    
    const handleOpenAddCredits = (agent: Agent) => {
        setSelectedAgent(agent);
        setCreditsToAdd(100);
        setAddCreditsModalOpen(true);
    };

    const handleAddCredits = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAgent || creditsToAdd <= 0) return;

        try {
            const updatedAgent = JSON.parse(JSON.stringify(selectedAgent));
            const newBalance = updatedAgent.credits + creditsToAdd;
            updatedAgent.credits = newBalance;

            const newHistoryEntry: CreditHistoryEntry = {
                date: new Date().toISOString(),
                action: `เติมเครดิตโดยแอดมิน`,
                amount: creditsToAdd,
                balanceAfter: newBalance,
            };
            updatedAgent.creditHistory = [...(updatedAgent.creditHistory || []), newHistoryEntry];

            await handleUpdateAgent(updatedAgent);
            setAddCreditsModalOpen(false);
            toast.success('เติมเครดิตสำเร็จ');
        } catch (err) {
            toast.error('เติมเครดิตไม่สำเร็จ');
        }
    };

    const handleUpdateAgent = async (agent: Agent) => {
        await updateAgent(agent);
        refreshData();
        // Also update the selected agent in state to reflect changes immediately in modal
        setSelectedAgent(agent); 
    };

    return (
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <PageHeader
                      icon={<UserGroupIcon className="w-5 h-5" />}
                      title="จัดการตัวแทน"
                      description="เพิ่มและดูข้อมูลตัวแทนในระบบ"
                    />
                </div>
                <Button onClick={() => setAddAgentModalOpen(true)}>+ เพิ่มตัวแทน</Button>
            </div>

            {loading ? <p>กำลังโหลดข้อมูลตัวแทน...</p> : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {agents.map(u => <AgentCard key={u.id} agent={u} onViewHistory={handleOpenHistory} onManageKeys={handleOpenKeys} onAddCredits={handleOpenAddCredits} platforms={platforms} />)}
                </div>
            )}
             { !loading && agents.length === 0 && <p className="text-slate-500 text-center py-10">ไม่พบตัวแทน คลิก "+ เพิ่มตัวแทน" เพื่อสร้าง</p>}

            <Modal isOpen={isAddAgentModalOpen} onClose={() => setAddAgentModalOpen(false)} title="เพิ่มตัวแทนใหม่">
                 <form onSubmit={handleAddAgent} className="space-y-4">
                    <Input label="ชื่อผู้ใช้" placeholder="เช่น agent_007" value={newAgentData.username} onChange={e => setNewAgentData({...newAgentData, username: e.target.value})} required />
                    <Input label="รหัสผ่าน" type="password" placeholder="ตั้งรหัสผ่านสำหรับตัวแทน" value={newAgentData.password} onChange={e => setNewAgentData({...newAgentData, password: e.target.value})} required />
                    <Input label="เครดิตเริ่มต้น" type="number" placeholder="เช่น 1000" value={newAgentData.credits} onChange={e => setNewAgentData({...newAgentData, credits: Number(e.target.value)})} required />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setAddAgentModalOpen(false)}>ยกเลิก</Button>
                        <Button type="submit">สร้างตัวแทน</Button>
                    </div>
                 </form>
            </Modal>
            
            <Modal isOpen={isAddCreditsModalOpen} onClose={() => setAddCreditsModalOpen(false)} title={`เติมเครดิตสำหรับ ${selectedAgent?.username}`}>
                 <form onSubmit={handleAddCredits} className="space-y-4">
                    <div>
                        <p className="text-sm text-slate-600">เครดิตปัจจุบัน: <span className="font-bold text-blue-600">{selectedAgent?.credits.toLocaleString()}</span></p>
                    </div>
                    <Input label="จำนวนเครดิตที่ต้องการเพิ่ม" type="number" placeholder="เช่น 500" value={creditsToAdd} onChange={e => setCreditsToAdd(Number(e.target.value))} required />
                    
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setAddCreditsModalOpen(false)}>ยกเลิก</Button>
                        <Button type="submit">ยืนยันการเติม</Button>
                    </div>
                 </form>
            </Modal>

            <Modal isOpen={isHistoryModalOpen} onClose={() => setHistoryModalOpen(false)} title={`ประวัติเครดิต: ${selectedAgent?.username}`}>
                <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-slate-50 text-slate-500">
                            <tr>
                                <th className="p-1 font-semibold">วันที่</th>
                                <th className="p-1 font-semibold">รายการ</th>
                                <th className="p-1 font-semibold text-right">จำนวน</th>
                                <th className="p-1 font-semibold text-right">คงเหลือ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedAgent?.creditHistory && selectedAgent.creditHistory.length > 0 ? (
                                [...selectedAgent.creditHistory].reverse().map((entry, index) => (
                                    <tr key={index} className="border-b border-slate-200 last:border-b-0 odd:bg-white even:bg-slate-50 hover:bg-slate-100">
                                        <td className="p-1 text-slate-500 whitespace-nowrap">{new Date(entry.date).toLocaleString('th-TH')}</td>
                                        <td className="p-1 text-slate-600">{entry.action}</td>
                                        <td className={`p-1 text-right font-semibold ${entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {entry.amount >= 0 ? `+${entry.amount.toLocaleString()}` : entry.amount.toLocaleString()}
                                        </td>
                                        <td className="p-1 text-right text-slate-600">{entry.balanceAfter.toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center p-6 text-slate-500">ไม่พบประวัติเครดิต</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                 <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
                    <Button variant="secondary" onClick={() => setHistoryModalOpen(false)}>ปิด</Button>
                </div>
            </Modal>

            <ManageKeysModal 
                agent={selectedAgent}
                platforms={platforms}
                isOpen={isKeysModalOpen}
                onClose={() => setKeysModalOpen(false)}
                onUpdateAgent={handleUpdateAgent}
            />
        </div>
    );
};

export default AgentsPage;