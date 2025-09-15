import React, { useState, useEffect } from 'react';
import { useData, useSettings } from '../App';
import { StandaloneKey } from '../types';
import { updateStandaloneKey, deleteStandaloneKey } from '../services/firebaseService';
import PlatformTabs from '../components/ui/PlatformTabs';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
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
    } catch {
      notify(t('copyFailed'), 'error');
    } finally {
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleStatus = () => {
    const newStatus = apiKey.status === 'active' ? 'inactive' : 'active';
    onUpdateStatus(apiKey, newStatus);
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
            onClick={() => onDelete(apiKey)}
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

const StandaloneKeysPage: React.FC = () => {
  const { standaloneKeys, platforms, loading, refreshData } = useData();
  const { notify, t } = useSettings();
  const [selectedPlatformId, setSelectedPlatformId] = useState(platforms[0]?.id || '');
  const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<StandaloneKey | null>(null);

  useEffect(() => {
    if (platforms.length > 0 && !selectedPlatformId) {
      setSelectedPlatformId(platforms[0].id);
    }
  }, [platforms, selectedPlatformId]);

  const filteredKeys = standaloneKeys.filter(k => k.platformId === selectedPlatformId);

  const handleUpdateKeyStatus = async (key: StandaloneKey, status: 'active' | 'inactive') => {
    await updateStandaloneKey(key.id, { status });
    refreshData();
    notify(t('settingsSaved'));
  };

  const confirmDeleteKey = (key: StandaloneKey) => {
    setKeyToDelete(key);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;
    await deleteStandaloneKey(keyToDelete.id);
    setConfirmDeleteOpen(false);
    setKeyToDelete(null);
    refreshData();
    notify(t('delete'));
  };

  return (
    <div className="space-y-6">
      <PlatformTabs platforms={platforms} selected={selectedPlatformId} onSelect={setSelectedPlatformId} />
      <Card>
        <CardHeader>
          <CardTitle>{t('manageKeys')}</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-2 font-semibold">{t('key')}</th>
                <th className="p-2 font-semibold">โทเค็น</th>
                <th className="p-2 font-semibold">สถานะ</th>
                <th className="p-2 font-semibold">วันที่สร้าง</th>
                <th className="p-2 font-semibold text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center p-4">กำลังโหลดคีย์...</td></tr>
              ) : filteredKeys.length > 0 ? (
                filteredKeys.map(k => (
                  <KeyRow key={k.id} apiKey={k} onUpdateStatus={handleUpdateKeyStatus} onDelete={confirmDeleteKey} />
                ))
              ) : (
                <tr><td colSpan={5} className="text-center p-6 text-slate-500">ยังไม่มีการสร้างคีย์ทั่วไป</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isConfirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} title="ยืนยันการลบ">
        <div>
          <p className="text-slate-600 mb-4">คุณแน่ใจหรือไม่ว่าต้องการลบคีย์ <strong className="font-semibold text-slate-800 font-mono">{keyToDelete?.key}</strong>? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
          <div className="flex justify-end gap-3 mt-6">
            <button className="px-4 py-2 rounded-md bg-slate-200" onClick={() => setConfirmDeleteOpen(false)}>ยกเลิก</button>
            <button className="px-4 py-2 rounded-md bg-red-600 text-white" onClick={handleDeleteKey}>ยืนยันการลบ</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StandaloneKeysPage;
