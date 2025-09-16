import React, { useMemo, useState } from 'react';
import { useData, useSettings, useAuth } from '../App';
import { Agent, CreditHistoryEntry } from '../types';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { addAgent, updateAgent, deleteAgent } from '../services/firebaseService';
import { useExpirationCountdown } from '../hooks/useExpirationCountdown';

interface SubAgentForm {
  username: string;
  password: string;
  credits: number;
  expirationAt: string;
}

const SubAgentCard: React.FC<{
  agent: Agent;
  onAddCredits: (agent: Agent) => void;
  onEditExpiration: (agent: Agent) => void;
  onBan: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
}> = ({ agent, onAddCredits, onEditExpiration, onBan, onDelete }) => {
  const { expirationDate, isExpired, formattedTimeLeft } = useExpirationCountdown(agent.expirationAt);
  const expirationText = expirationDate ? expirationDate.toLocaleString('th-TH') : 'ไม่มีวันหมดอายุ';
  const expirationDescription = useMemo(() => {
    if (!expirationDate) {
      return 'ไม่มีวันหมดอายุ';
    }
    if (isExpired) {
      return `หมดอายุ: ${expirationText} (บัญชีหมดอายุแล้ว)`;
    }
    return `หมดอายุ: ${expirationText} (เหลือเวลา ${formattedTimeLeft})`;
  }, [expirationDate, expirationText, formattedTimeLeft, isExpired]);

  return (
    <Card key={agent.id}>
      <CardHeader className="flex justify-between items-start">
        <div>
          <CardTitle className={agent.status === 'banned' ? 'text-red-600' : undefined}>{agent.username}</CardTitle>
          <p className="text-xs text-slate-400 font-mono mt-1">{agent.id}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-blue-600">{agent.credits.toLocaleString()}</p>
          <p className="text-xs text-slate-500">เครดิต</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className={`text-xs mb-3 ${isExpired ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
          {expirationDescription}
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onAddCredits(agent)} className="flex-1">เติมเครดิต</Button>
            <Button size="sm" variant={agent.status === 'banned' ? 'secondary' : 'danger'} onClick={() => onBan(agent)} className="flex-1">
              {agent.status === 'banned' ? 'ปลดแบน' : 'แบน'}
            </Button>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onEditExpiration(agent)}
            className="w-full"
          >
            {agent.expirationAt ? 'แก้ไขวันหมดอายุ' : 'ตั้งวันหมดอายุ'}
          </Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(agent)} className="w-full">ลบ</Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AgentAgentsPage: React.FC = () => {
  const { agents, refreshData } = useData();
  const { user, updateUserData } = useAuth();
  const { notify, t } = useSettings();
  const parent = user?.data as Agent;
  const myAgents = agents.filter(a => a.parentId === parent.id);

  const [isAddModal, setAddModal] = useState(false);
  const [newAgent, setNewAgent] = useState<SubAgentForm>({ username: '', password: '', credits: 100, expirationAt: '' });
  const [selected, setSelected] = useState<Agent | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState(100);
  const [isCreditModal, setCreditModal] = useState(false);
  const [isExpirationModal, setExpirationModal] = useState(false);
  const [agentForExpiration, setAgentForExpiration] = useState<Agent | null>(null);
  const [expirationValue, setExpirationValue] = useState('');
  const [expirationError, setExpirationError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const initialCredits = newAgent.credits;
    if (parent.credits < initialCredits) {
      notify('เครดิตไม่พอ', 'error');
      return;
    }
    let expirationIso: string | undefined;
    if (newAgent.expirationAt) {
      const expirationDate = new Date(newAgent.expirationAt);
      if (Number.isNaN(expirationDate.getTime())) {
        notify('รูปแบบวันหมดอายุไม่ถูกต้อง', 'error');
        return;
      }
      if (expirationDate.getTime() <= Date.now()) {
        notify('วันหมดอายุต้องอยู่ในอนาคต', 'error');
        return;
      }
      expirationIso = expirationDate.toISOString();
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
      expirationAt: expirationIso,
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
    setNewAgent({ username: '', password: '', credits: 100, expirationAt: '' });
    notify('สร้างตัวแทนแล้ว');
  };

  const openAddCredits = (agent: Agent) => {
    setSelected(agent);
    setCreditsToAdd(100);
    setCreditModal(true);
  };

  const formatDateTimeLocal = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const openExpirationModal = (agent: Agent) => {
    setAgentForExpiration(agent);
    setExpirationValue(agent.expirationAt ? formatDateTimeLocal(agent.expirationAt) : '');
    setExpirationError('');
    setExpirationModal(true);
  };

  const closeExpirationModal = () => {
    setExpirationModal(false);
    setAgentForExpiration(null);
    setExpirationError('');
    setExpirationValue('');
  };

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
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

  const handleUpdateExpiration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentForExpiration) return;
    setExpirationError('');

    let expirationIso: string | undefined;
    if (expirationValue) {
      const expirationDate = new Date(expirationValue);
      if (Number.isNaN(expirationDate.getTime())) {
        setExpirationError('รูปแบบวันหมดอายุไม่ถูกต้อง');
        return;
      }
      if (expirationDate.getTime() <= Date.now()) {
        setExpirationError('วันหมดอายุต้องอยู่ในอนาคต');
        return;
      }
      expirationIso = expirationDate.toISOString();
    }

    const updatedAgent: Agent = { ...agentForExpiration, expirationAt: expirationIso };
    await updateAgent(updatedAgent);
    refreshData();
    closeExpirationModal();
    notify(expirationIso ? 'บันทึกวันหมดอายุแล้ว' : 'ลบวันหมดอายุแล้ว');
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
          {myAgents.map(agent => (
            <SubAgentCard
              key={agent.id}
              agent={agent}
              onAddCredits={openAddCredits}
              onEditExpiration={openExpirationModal}
              onBan={handleBan}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-500">{t('noAgents')}</p>
      )}

      <Modal isOpen={isAddModal} onClose={() => setAddModal(false)} title="เพิ่มตัวแทน">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="ชื่อผู้ใช้" value={newAgent.username} onChange={e => setNewAgent({ ...newAgent, username: e.target.value })} required />
          <Input label="รหัสผ่าน" type="password" value={newAgent.password} onChange={e => setNewAgent({ ...newAgent, password: e.target.value })} required />
          <Input label="เครดิตเริ่มต้น" type="number" value={newAgent.credits} onChange={e => setNewAgent({ ...newAgent, credits: Number(e.target.value) })} required />
          <Input label="วันหมดอายุ (ไม่บังคับ)" type="datetime-local" value={newAgent.expirationAt} onChange={e => setNewAgent({ ...newAgent, expirationAt: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAddModal(false)}>ยกเลิก</Button>
            <Button type="submit">บันทึก</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isCreditModal} onClose={() => setCreditModal(false)} title="เติมเครดิต">
        <form onSubmit={handleAddCredits} className="space-y-4">
          <Input label="จำนวนเครดิต" type="number" value={creditsToAdd} onChange={e => setCreditsToAdd(Number(e.target.value))} required />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreditModal(false)}>ยกเลิก</Button>
            <Button type="submit">เติม</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isExpirationModal}
        onClose={closeExpirationModal}
        title={`กำหนดวันหมดอายุ: ${agentForExpiration?.username ?? ''}`}
      >
        <form onSubmit={handleUpdateExpiration} className="space-y-4">
          <Input
            label="วันหมดอายุ"
            type="datetime-local"
            value={expirationValue}
            onChange={e => setExpirationValue(e.target.value)}
          />
          {expirationError && <p className="text-red-500 text-sm">{expirationError}</p>}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setExpirationValue('')}
              className="w-full sm:w-auto"
            >
              ลบวันหมดอายุ
            </Button>
            <div className="flex gap-2 justify-end w-full sm:w-auto">
              <Button type="button" variant="secondary" onClick={closeExpirationModal}>ยกเลิก</Button>
              <Button type="submit">บันทึก</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AgentAgentsPage;

