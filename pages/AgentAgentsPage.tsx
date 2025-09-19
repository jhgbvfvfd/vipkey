import React, { useState } from 'react';
import { useData, useSettings, useAuth } from '../App';
import { Agent, CreditHistoryEntry } from '../types';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { addAgent, updateAgent, deleteAgent } from '../services/firebaseService';

const MAX_CREDIT_TRANSFER = 1_000_000;

const AgentAgentsPage: React.FC = () => {
  const { agents, refreshData } = useData();
  const { user, updateUserData } = useAuth();
  const { notify, t } = useSettings();
  const parent = user?.data as Agent;
  const myAgents = agents.filter(a => a.parentId === parent.id);

  const [isAddModal, setAddModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ username: '', password: '', credits: 100 });
  const [selected, setSelected] = useState<Agent | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState(100);
  const [isCreditModal, setCreditModal] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const initialCredits = newAgent.credits;
    if (!Number.isFinite(initialCredits) || initialCredits <= 0) {
      notify('กรุณากรอกเครดิตเริ่มต้นมากกว่า 0', 'error');
      return;
    }
    if (initialCredits > MAX_CREDIT_TRANSFER) {
      notify(`โอนเครดิตได้ไม่เกิน ${MAX_CREDIT_TRANSFER.toLocaleString('th-TH')} ต่อครั้ง`, 'error');
      return;
    }
    if (parent.credits < initialCredits) {
      notify('เครดิตไม่พอ', 'error');
      return;
    }
    if (!window.confirm(`ยืนยันสร้างตัวแทนนี้และหักเครดิต ${initialCredits}?`)) return;
    const newId = `agent-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const childHistory: CreditHistoryEntry = {
      date: now,
      action: 'เครดิตเริ่มต้น',
      amount: initialCredits,
      balanceAfter: initialCredits,
    };
    const parentBalance = parent.credits - initialCredits;
    const parentHistory: CreditHistoryEntry = {
      date: now,
      action: `โอนให้ ${newAgent.username}`,
      amount: -initialCredits,
      balanceAfter: parentBalance,
    };
    await addAgent({
      id: newId,
      username: newAgent.username,
      password: newAgent.password,
      credits: initialCredits,
      createdAt: now,
      keys: {},
      creditHistory: [childHistory],
      status: 'active',
      parentId: parent.id,
    });
    const updatedParent: Agent = {
      ...parent,
      credits: parentBalance,
      creditHistory: [...(parent.creditHistory || []), parentHistory],
    };
    await updateAgent(updatedParent);
    updateUserData(updatedParent);
    refreshData();
    setAddModal(false);
    setNewAgent({ username: '', password: '', credits: 100 });
    notify('สร้างตัวแทนแล้ว');
  };

  const openAddCredits = (agent: Agent) => {
    setSelected(agent);
    setCreditsToAdd(Math.min(100, MAX_CREDIT_TRANSFER));
    setCreditModal(true);
  };

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!Number.isFinite(creditsToAdd) || creditsToAdd <= 0) {
      notify('กรุณาระบุจำนวนเครดิตมากกว่า 0', 'error');
      return;
    }
    if (creditsToAdd > MAX_CREDIT_TRANSFER) {
      notify(`โอนเครดิตได้ไม่เกิน ${MAX_CREDIT_TRANSFER.toLocaleString('th-TH')} ต่อครั้ง`, 'error');
      return;
    }
    if (parent.credits < creditsToAdd) {
      notify('เครดิตไม่พอ', 'error');
      return;
    }
    if (!window.confirm(`หักเครดิต ${creditsToAdd} เพื่อเติมให้ ${selected.username}?`)) return;
    const now = new Date().toISOString();
    const childBalance = selected.credits + creditsToAdd;
    const parentBalance = parent.credits - creditsToAdd;
    const childHistory: CreditHistoryEntry = {
      date: now,
      action: 'รับเครดิตจากตัวแทน',
      amount: creditsToAdd,
      balanceAfter: childBalance,
    };
    const parentHistory: CreditHistoryEntry = {
      date: now,
      action: `โอนให้ ${selected.username}`,
      amount: -creditsToAdd,
      balanceAfter: parentBalance,
    };
    const updatedChild: Agent = {
      ...selected,
      credits: childBalance,
      creditHistory: [...(selected.creditHistory || []), childHistory],
    };
    const updatedParent: Agent = {
      ...parent,
      credits: parentBalance,
      creditHistory: [...(parent.creditHistory || []), parentHistory],
    };
    await updateAgent(updatedChild);
    await updateAgent(updatedParent);
    updateUserData(updatedParent);
    refreshData();
    setCreditModal(false);
    notify('เติมเครดิตสำเร็จ');
  };

  const handleBan = async (agent: Agent) => {
    const updated = { ...agent, status: agent.status === 'banned' ? 'active' : 'banned' };
    await updateAgent(updated);
    refreshData();
    notify(agent.status === 'banned' ? 'ปลดแบนแล้ว' : 'แบนตัวแทนแล้ว');
  };

  const handleDelete = async (agent: Agent) => {
    if (!window.confirm('แน่ใจหรือไม่ว่าต้องการลบตัวแทนนี้?')) return;
    await deleteAgent(agent.id);
    refreshData();
    notify('ลบตัวแทนแล้ว');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t('agents')}</h2>
        <Button onClick={() => setAddModal(true)}>{t('add')}</Button>
      </div>
      {myAgents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myAgents.map(a => (
            <Card key={a.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className={`${a.status === 'banned' ? 'text-red-600' : ''} break-words`}>{a.username}</CardTitle>
                  <p className="mt-1 text-xs font-mono text-slate-400 break-all">{a.id}</p>
                </div>
                <div className="min-w-0 text-left sm:text-right">
                  <p className="text-lg font-bold leading-tight text-blue-600 break-words sm:text-xl">{a.credits.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 sm:whitespace-nowrap">เครดิต</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-2">
                  <Button size="sm" onClick={() => openAddCredits(a)} className="flex-1">เติมเครดิต</Button>
                  <Button size="sm" variant={a.status === 'banned' ? 'secondary' : 'danger'} onClick={() => handleBan(a)} className="flex-1">{a.status === 'banned' ? 'ปลดแบน' : 'แบน'}</Button>
                </div>
                <Button size="sm" variant="danger" onClick={() => handleDelete(a)} className="w-full">ลบ</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-500">{t('noAgents')}</p>
      )}

      <Modal isOpen={isAddModal} onClose={() => setAddModal(false)} title="เพิ่มตัวแทน">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="ชื่อผู้ใช้" value={newAgent.username} onChange={e => setNewAgent({ ...newAgent, username: e.target.value })} required />
          <Input label="รหัสผ่าน" type="password" value={newAgent.password} onChange={e => setNewAgent({ ...newAgent, password: e.target.value })} required />
          <Input
            label="เครดิตเริ่มต้น"
            type="number"
            value={newAgent.credits}
            min={0}
            max={MAX_CREDIT_TRANSFER}
            onChange={e => {
              const value = Number(e.target.value);
              setNewAgent({
                ...newAgent,
                credits: Math.max(0, Math.min(MAX_CREDIT_TRANSFER, Number.isFinite(value) ? value : 0)),
              });
            }}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAddModal(false)}>ยกเลิก</Button>
            <Button type="submit">บันทึก</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isCreditModal} onClose={() => setCreditModal(false)} title="เติมเครดิต">
        <form onSubmit={handleAddCredits} className="space-y-4">
          <Input
            label="จำนวนเครดิต"
            type="number"
            value={creditsToAdd}
            min={0}
            max={MAX_CREDIT_TRANSFER}
            onChange={e => {
              const value = Number(e.target.value);
              setCreditsToAdd(Math.max(0, Math.min(MAX_CREDIT_TRANSFER, Number.isFinite(value) ? value : 0)));
            }}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreditModal(false)}>ยกเลิก</Button>
            <Button type="submit">เติม</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AgentAgentsPage;

